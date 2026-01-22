import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';

// Helper to find value in row regardless of case or whitespace in key
const getValue = (row: any, keys: string[]): any => {
    if (!row) return undefined;
    
    // Normalize row keys once per call (could be optimized but fine for <10k rows)
    const rowKeys = Object.keys(row);
    const normalizedRowKeys = rowKeys.reduce((acc, key) => {
        // Create a map where 'uc 12mm' -> 'UC 12mm' (original key)
        // Also remove extra spaces to be safe: 'uc 12mm ' -> 'uc12mm'
        const cleanKey = key.trim().toLowerCase();
        acc[cleanKey] = key; 
        return acc;
    }, {} as Record<string, string>);

    for (const key of keys) {
        const searchKey = key.trim().toLowerCase();
        if (normalizedRowKeys[searchKey]) {
            return row[normalizedRowKeys[searchKey]];
        }
    }
    return undefined;
};

/**
 * Robust Number Parser for Latin/EU Formats (1.234,56)
 * Handles:
 * - "101.242" -> 101242 (Dot as thousand separator)
 * - "61,9%" -> 0.619 (Comma as decimal, percentage handling)
 * - "2,969" -> 2.969 (Comma as decimal)
 * - Raw numbers
 */
const parseNum = (val: any, isPercentage: boolean = false): number => {
    if (typeof val === 'number') {
        // If Excel already parsed it as a number, we use it. 
        // CAUTION: If Excel parsed "101.242" as 101.242 but meant 101k, this might still be low.
        // However, usually XLSX parsing with default settings handles standard formats well if the cell category is Number.
        // If the cell category is General/Text, we get strings.
        return isPercentage && val > 1 ? val / 100 : val;
    }
    
    if (!val) return 0;
    
    let str = String(val).trim();
    if (str === '' || str === '-') return 0;

    // Handle Percentage Symbol
    let isPercentValue = false;
    if (str.includes('%')) {
        str = str.replace('%', '');
        isPercentValue = true;
    }

    // CLEANING LOGIC (LATAM/EU: Dot=Thousand, Comma=Decimal)
    // 1. Remove all dots (thousands)
    // 2. Replace comma with dot (decimal)
    
    // Heuristic: If string has dots but NO commas (e.g. "101.242"), assume dot is thousand separator 
    // unless it looks like a small decimal (unlikely for Volumes). 
    // Given the user screenshot, volumes are "101.242", "40.550". These are Integers.
    
    // Step 1: Remove thousands separator (.)
    str = str.replace(/\./g, '');
    
    // Step 2: Replace decimal separator (,) with (.) for JS parsing
    str = str.replace(',', '.');

    let num = parseFloat(str);

    if (isNaN(num)) return 0;

    // Final adjustment for percentages
    if (isPercentage || isPercentValue) {
        // If we parsed "61.9" from "61,9%", we want 0.619 usually, or keep 61.9 depending on UI.
        // The UI expects 0.XX for shares usually, but the screenshot shows "61,9%".
        // Let's normalize: if > 1 and isPercentage, divide by 100.
        if (num > 1) {
            num = num / 100;
        }
    }

    return num;
};

// Helper to sanitize keys from Excel
const sanitizeData = (rawData: any[]): SalesRecord[] => {
    return rawData.map((row, index) => {
        // Debug first row to help identify mapping issues in console
        if (index === 0) console.log("Sample Row Parsing:", row);

        // Parse YTD values
        const ytd25 = parseNum(getValue(row, ['2025 ytd', '2025 YTD', 'YTD 2025', 'Venta 2025', 'ytd25', 'ytd 25']));
        const ytd26 = parseNum(getValue(row, ['2026 ytd', '2026 YTD', 'YTD 2026', 'Venta 2026', 'ytd26', 'ytd 26']));
        
        // Calculate Variation dynamically
        let calculatedVar = 0;
        if (ytd25 > 0) {
            calculatedVar = (ytd26 / ytd25) - 1;
        } else if (ytd26 > 0) {
            calculatedVar = 1; // 100% growth
        }

        return {
            id: `row-${index}`,
            // Added RazonCliente to the list
            RazonSocial: getValue(row, ['RazonCliente', 'RazonSocial', 'Cliente', 'Nombre', 'Razon Social']) || 'Desconocido',
            // Added Sello to the list
            GEC: getValue(row, ['GEC', 'Clasificacion', 'Sello']) || 'Otros',
            GrupoCanal: getValue(row, ['GrupoCanal', 'Subcanal', 'Canal', 'Grupo Canal']) || 'Otros',
            RutaVenta: getValue(row, ['RutaVenta', 'Ruta', 'Codigo Ruta', 'Ruta Venta']) || 'S/R',
            RutaDesarr: getValue(row, ['RutaDesarr', 'Desarrollador', 'Vendedor', 'Ruta Desarr']) || 'S/D',
            
            // VOLUMES (Assume integers, remove dots)
            UC12mm: parseNum(getValue(row, ['UC 12mm', 'Volumen', 'UC', 'Venta Anual', 'uc12mm'])),
            
            // Map new fields
            YTD2025: ytd25,
            YTD2026: ytd26,
            Var2025vs2024: calculatedVar,

            // SHARE (Handle %)
            ShareREFRESCOS: parseNum(getValue(row, ['Share REFRESCOS', 'Share', 'Part. Mercado', 'share refrescos']), true),
            
            // PRICES (Handle decimals with comma)
            TP: parseNum(getValue(row, ['TP', 'Ticket Promedio', 'Ticket'])),
            TP_RED: parseNum(getValue(row, ['TP RED', 'TP_RED', 'TP %', '% TP', 'TP Red']), true), // Often a % or decimal

            // CATEGORIES
            VolColas: parseNum(getValue(row, ['COLAS', 'Vol Colas', 'colas'])),
            VolSabores: parseNum(getValue(row, ['SABORES', 'Vol Sabores', 'sabores'])),
            VolAgua: parseNum(getValue(row, ['AGUA PLAIN', 'AGUA', 'Vol Agua', 'agua plain'])),
            VolSaborizadas: parseNum(getValue(row, ['SABORIZADAS', 'Vol Saborizadas', 'saborizadas'])),
            VolJugos: parseNum(getValue(row, ['JUGOS', 'Vol Jugos', 'jugos'])),
            VolIsotonico: parseNum(getValue(row, ['ISOTÓNICO', 'ISOTONICO', 'Vol Isotonico', 'isotonico', 'isotónico'])),
            VolEnergizantes: parseNum(getValue(row, ['ENERGIZANTES', 'Vol Energizantes', 'energizantes'])),
            VolSpirits: parseNum(getValue(row, ['SPIRITS', 'Vol Spirits', 'spirits'])),
            VolVinos: parseNum(getValue(row, ['VINOS', 'Vol Vinos', 'vinos']))
        };
    });
};

export const parseExcelFile = (file: File): Promise<SalesRecord[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                // Use raw: false to try to get formatted strings (which helps if Excel formatted them as 1.000)
                // However, sheet_to_json often works best with raw values.
                // Let's stick to default but handle the output strings in `sanitizeData`
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                
                if (jsonData.length === 0) {
                    throw new Error("El archivo parece estar vacío o no se pudo leer la primera hoja.");
                }

                const sanitized = sanitizeData(jsonData);
                resolve(sanitized);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

/**
 * DATABASE OPERATIONS
 */

export const saveToStorage = async (data: SalesRecord[]): Promise<void> => {
    // 1. Optimistic update: Save to LocalStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    try {
        console.log("Starting Cloud Sync via Server API...");
        
        // Use the existing API endpoint to handle the upload server-side
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log("Cloud Sync Success:", result);
    } catch (error) {
        console.error("Failed to sync to cloud:", error);
        throw error; 
    }
};

export const loadFromStorage = async (forceCloud: boolean = false): Promise<SalesRecord[]> => {
    // 1. Always try to fetch fresh data from the API first
    try {
        console.log("Fetching fresh data from Cloud API...");
        // CRITICAL: We add ?_t=TIMESTAMP to the URL.
        const response = await fetch(`/api/sales?_t=${new Date().getTime()}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (response.ok) {
            const dbJson = await response.json();
            if (Array.isArray(dbJson) && dbJson.length > 0) {
                console.log("Cloud data loaded successfully");
                // Update local cache for offline fallback next time
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbJson));
                return dbJson;
            }
        } else if (response.status === 404) {
            console.warn("No cloud database found yet.");
        }
    } catch (error) {
        console.warn("Cloud Load Failed (Offline?), falling back to local cache:", error);
    }

    // 2. Fallback to LocalStorage if API fails or is offline
    if (!forceCloud) {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                console.log("Using cached LocalStorage data.");
                return JSON.parse(stored);
            } catch (e) {
                console.error("Local storage corrupted");
            }
        }
    }

    // 3. Fallback to Mock Data if completely empty
    console.log("No data found anywhere, using MOCK_DATA");
    return MOCK_DATA;
};
