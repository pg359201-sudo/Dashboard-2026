import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';

// Helper to find value in row regardless of case or whitespace in key
const getValue = (row: any, keys: string[]): any => {
    // Normalize row keys once for performance could be better, but for this scale valid on fly
    const rowKeys = Object.keys(row);
    const normalizedRowKeys = rowKeys.reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = key; // Map "  uc 12mm " -> "uc 12mm" -> original key
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

// Helper to parse numbers safely (handles strings with commas if necessary, though XLSX usually handles type)
const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Handle string numbers like "1,200.50" or "1.200,50" if they come as text
    // Simple heuristic: remove non-numeric chars except dot and comma
    const str = String(val).trim();
    if (str === '') return 0;
    // Attempt standard parse
    const num = Number(str);
    if (!isNaN(num)) return num;
    return 0;
};

// Helper to sanitize keys from Excel
const sanitizeData = (rawData: any[]): SalesRecord[] => {
    return rawData.map((row, index) => {
        // Parse YTD values using fuzzy matching
        const ytd25 = parseNum(getValue(row, ['2025 ytd', '2025 YTD', 'YTD 2025', 'Venta 2025', 'ytd25']));
        const ytd26 = parseNum(getValue(row, ['2026 ytd', '2026 YTD', 'YTD 2026', 'Venta 2026', 'ytd26']));
        
        // Calculate Variation dynamically
        // Formula: (2026 / 2025) - 1
        let calculatedVar = 0;
        if (ytd25 > 0) {
            calculatedVar = (ytd26 / ytd25) - 1;
        } else if (ytd26 > 0) {
            calculatedVar = 1; // 100% growth if base was 0 but current is positive
        }

        return {
            id: `row-${index}`,
            RazonSocial: getValue(row, ['RazonSocial', 'Cliente', 'Nombre']) || 'Desconocido',
            GEC: getValue(row, ['GEC', 'Clasificacion']) || 'Otros',
            GrupoCanal: getValue(row, ['GrupoCanal', 'Subcanal', 'Canal']) || 'Otros',
            RutaVenta: getValue(row, ['RutaVenta', 'Ruta', 'Codigo Ruta']) || 'S/R',
            RutaDesarr: getValue(row, ['RutaDesarr', 'Desarrollador', 'Vendedor']) || 'S/D',
            
            UC12mm: parseNum(getValue(row, ['UC 12mm', 'Volumen', 'UC', 'Venta Anual'])),
            
            // Map new fields
            YTD2025: ytd25,
            YTD2026: ytd26,
            Var2025vs2024: calculatedVar,

            ShareREFRESCOS: parseNum(getValue(row, ['Share REFRESCOS', 'Share', 'Part. Mercado'])),
            
            // Robust parsing for TP fields with multiple aliases
            TP: parseNum(getValue(row, ['TP', 'Ticket Promedio', 'Ticket'])),
            TP_RED: parseNum(getValue(row, ['TP RED', 'TP_RED', 'TP %', '% TP', 'TP Red'])),

            // Parsing detailed product categories based on header image
            VolColas: parseNum(getValue(row, ['COLAS', 'Vol Colas'])),
            VolSabores: parseNum(getValue(row, ['SABORES', 'Vol Sabores'])),
            VolAgua: parseNum(getValue(row, ['AGUA PLAIN', 'AGUA', 'Vol Agua'])),
            VolSaborizadas: parseNum(getValue(row, ['SABORIZADAS', 'Vol Saborizadas'])),
            VolJugos: parseNum(getValue(row, ['JUGOS', 'Vol Jugos'])),
            VolIsotonico: parseNum(getValue(row, ['ISOTÓNICO', 'ISOTONICO', 'Vol Isotonico'])),
            VolEnergizantes: parseNum(getValue(row, ['ENERGIZANTES', 'Vol Energizantes'])),
            VolSpirits: parseNum(getValue(row, ['SPIRITS', 'Vol Spirits'])),
            VolVinos: parseNum(getValue(row, ['VINOS', 'Vol Vinos']))
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
                const jsonData = XLSX.utils.sheet_to_json(sheet);
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
        // This avoids 404s from missing /api/upload routes for client-side upload handling
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
        // This forces the browser to treat it as a brand new request, ignoring its local cache.
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
    // Only use fallback if we are NOT strictly forcing a cloud refresh
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