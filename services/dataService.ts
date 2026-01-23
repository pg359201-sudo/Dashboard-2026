import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';

// Normaliza una clave eliminando todo lo que no sea letra o número
// Ej: "UC 12mm" -> "uc12mm", "Ruta Venta" -> "rutaventa"
const normalizeKey = (key: string): string => {
    if (!key) return '';
    return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper to find value in row by strictly comparing normalized keys
const getValue = (row: any, searchKeys: string[]): any => {
    if (!row) return undefined;
    
    // Obtenemos las claves reales del Excel (ej: "UC 12mm ", " Razon Social")
    const rowKeys = Object.keys(row);
    
    // Normalizamos las claves de búsqueda
    const normalizedSearchKeys = searchKeys.map(k => normalizeKey(k));

    for (const rowKey of rowKeys) {
        const normalizedRowKey = normalizeKey(rowKey);
        // Si la clave del Excel normalizada coincide con alguna de las que buscamos
        if (normalizedSearchKeys.includes(normalizedRowKey)) {
            return row[rowKey];
        }
    }
    return undefined;
};

/**
 * Robust Number Parser
 * Handles inconsistencies between Text/Number cells and Regional Formats.
 */
const parseNum = (val: any, isPercentage: boolean = false): number => {
    // 1. Si ya es un número (Excel lo leyó como número)
    if (typeof val === 'number') {
        // Ajuste porcentual si es necesario (ej: 0.5 vs 50)
        return isPercentage && val > 1 ? val / 100 : val;
    }
    
    // 2. Si es nulo o indefinido
    if (!val) return 0;
    
    // 3. Si es texto
    let str = String(val).trim();
    if (str === '' || str === '-') return 0;

    // Quitar símbolo de porcentaje
    let isPercentValue = false;
    if (str.includes('%')) {
        str = str.replace('%', '');
        isPercentValue = true;
    }

    // LÓGICA HÍBRIDA (Soporta formatos mezclados Latam/USA)
    // El usuario indica: "I a T son decimales".
    // Si viene "2,969" -> queremos 2.969
    // Si viene "101.242" -> queremos 101.242 (o 101242 si es miles, pero respetaremos decimal)
    
    // Estrategia Segura: 
    // Reemplazar coma por punto para que JS entienda el decimal.
    str = str.replace(',', '.');
    
    // Nota: NO eliminamos puntos existentes porque el usuario indicó que son decimales.
    // Solo si hubiera múltiples puntos (ej: 1.000.000) deberíamos limpiar, pero asumiremos formato simple.

    const num = parseFloat(str);

    if (isNaN(num)) return 0;

    // Ajuste final para porcentajes detectados por texto (ej: "61,9%")
    if (isPercentage || isPercentValue) {
        if (num > 1) {
            return num / 100;
        }
    }

    return num;
};

// Helper to sanitize keys from Excel
const sanitizeData = (rawData: any[]): SalesRecord[] => {
    return rawData.map((row, index) => {
        // Debug first row to console to help verification
        if (index === 0) console.log("Fila 1 Procesada:", row);

        // Parse YTD values
        const ytd25 = parseNum(getValue(row, ['2025 ytd', 'ytd25', 'venta2025']));
        const ytd26 = parseNum(getValue(row, ['2026 ytd', 'ytd26', 'venta2026']));
        
        // Calculate Variation dynamically
        let calculatedVar = 0;
        if (ytd25 > 0) {
            calculatedVar = (ytd26 / ytd25) - 1;
        } else if (ytd26 > 0) {
            calculatedVar = 1; // 100% growth
        }

        return {
            id: `row-${index}`,
            // TEXT COLUMNS (B-H)
            RazonSocial: getValue(row, ['RazonCliente', 'RazonSocial', 'Cliente', 'Nombre']) || 'Desconocido',
            GEC: getValue(row, ['GEC', 'Clasificacion', 'Sello']) || 'Otros',
            GrupoCanal: getValue(row, ['GrupoCanal', 'Grupo Canal', 'Canal']) || 'Otros',
            RutaVenta: getValue(row, ['RutaVenta', 'Ruta', 'Codigo Ruta']) || 'S/R',
            RutaDesarr: getValue(row, ['RutaDesarr', 'Ruta Desarr', 'Desarrollador']) || 'S/D',
            
            // NUMBER COLUMNS (I-T) - Using normalized keys to find them
            UC12mm: parseNum(getValue(row, ['UC 12mm', 'UC12mm', 'Volumen', 'UC', 'Venta Anual'])),
            
            // Map new fields
            YTD2025: ytd25,
            YTD2026: ytd26,
            Var2025vs2024: calculatedVar,

            // PRICES (Decimales)
            TP: parseNum(getValue(row, ['TP', 'Ticket Promedio', 'Ticket'])),
            TP_RED: parseNum(getValue(row, ['TP RED', 'TP_RED', 'TPRED'])), 

            // CATEGORIES
            VolColas: parseNum(getValue(row, ['COLAS', 'Vol Colas'])),
            VolSabores: parseNum(getValue(row, ['SABORES', 'Vol Sabores'])),
            VolAgua: parseNum(getValue(row, ['AGUA PLAIN', 'AGUA', 'Vol Agua'])),
            VolSaborizadas: parseNum(getValue(row, ['SABORIZADAS', 'Vol Saborizadas'])),
            VolJugos: parseNum(getValue(row, ['JUGOS', 'Vol Jugos'])),
            VolIsotonico: parseNum(getValue(row, ['ISOTÓNICO', 'ISOTONICO', 'Vol Isotonico'])),
            VolEnergizantes: parseNum(getValue(row, ['ENERGIZANTES', 'Vol Energizantes'])),
            VolSpirits: parseNum(getValue(row, ['SPIRITS', 'Vol Spirits'])),
            VolVinos: parseNum(getValue(row, ['VINOS', 'Vol Vinos'])),
            
            // PERCENTAGE COLUMNS (U-V)
            ShareREFRESCOS: parseNum(getValue(row, ['Share REFRESCOS', 'ShareRefrescos', 'Share']), true),
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
                
                // IMPORTANT: Use raw: false to get strings formatted (helps with some weird number formats)
                // BUT if we want precision for decimals, raw: true is usually better.
                // Given the mix, let's use default (raw: true mostly) but handled by our parser.
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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    try {
        console.log("Starting Cloud Sync via Server API...");
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to sync to cloud:", error);
        throw error; 
    }
};

export const loadFromStorage = async (forceCloud: boolean = false): Promise<SalesRecord[]> => {
    try {
        console.log("Fetching fresh data from Cloud API...");
        const response = await fetch(`/api/sales?_t=${new Date().getTime()}`, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });

        if (response.ok) {
            const dbJson = await response.json();
            if (Array.isArray(dbJson) && dbJson.length > 0) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbJson));
                return dbJson;
            }
        }
    } catch (error) {
        console.warn("Cloud Load Failed, falling back to local cache:", error);
    }

    if (!forceCloud) {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Local storage corrupted");
            }
        }
    }

    console.log("No data found anywhere, using MOCK_DATA");
    return MOCK_DATA;
};
