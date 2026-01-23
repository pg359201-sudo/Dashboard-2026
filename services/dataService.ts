import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';

// Normaliza una clave eliminando todo lo que no sea letra o número
// Ej: "UC 12mm" -> "uc12mm", "Ruta Venta" -> "rutaventa"
const normalizeKey = (key: string): string => {
    if (!key) return '';
    return String(key).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Helper to find value in row by strictly comparing normalized keys
const getValue = (row: any, searchKeys: string[]): any => {
    if (!row) return undefined;
    
    // Obtenemos las claves reales del Excel
    const rowKeys = Object.keys(row);
    
    // Normalizamos las claves de búsqueda
    const normalizedSearchKeys = searchKeys.map(k => normalizeKey(k));

    for (const rowKey of rowKeys) {
        const normalizedRowKey = normalizeKey(rowKey);
        if (normalizedSearchKeys.includes(normalizedRowKey)) {
            return row[rowKey];
        }
    }
    return undefined;
};

/**
 * Parseador Numérico Robusto (Formato Latino)
 * Asume: 
 * - PUNTO (.) es separador de miles (se elimina).
 * - COMA (,) es separador decimal (se cambia a punto).
 * Ej: "158.547" -> 158547
 * Ej: "0,797" -> 0.797
 */
const parseNum = (val: any, isPercentage: boolean = false): number => {
    // 1. Si ya es número nativo de Excel
    if (typeof val === 'number') {
        return isPercentage && val > 1 ? val / 100 : val;
    }
    
    if (!val) return 0;
    
    let str = String(val).trim();
    if (str === '' || str === '-') return 0;

    if (str.includes('%')) {
        str = str.replace('%', '');
        isPercentage = true;
    }

    // FIX CRÍTICO: Formato Latino
    // 1. Eliminar TODOS los puntos (son miles): "158.547" -> "158547"
    str = str.replace(/\./g, '');
    
    // 2. Reemplazar coma por punto (es decimal): "0,797" -> "0.797"
    str = str.replace(',', '.');

    const num = parseFloat(str);

    if (isNaN(num)) return 0;

    if (isPercentage && num > 1) {
        return num / 100;
    }

    return num;
};

// Helper to sanitize keys from Excel
const sanitizeData = (rawData: any[]): SalesRecord[] => {
    return rawData.map((row, index) => {
        // Parse YTD values
        const ytd25 = parseNum(getValue(row, ['2025 ytd', 'ytd25', '2025ytd', 'venta2025']));
        const ytd26 = parseNum(getValue(row, ['2026 ytd', 'ytd26', '2026ytd', 'venta2026']));
        
        let calculatedVar = 0;
        if (ytd25 > 0) {
            calculatedVar = (ytd26 / ytd25) - 1;
        } else if (ytd26 > 0) {
            calculatedVar = 1;
        }

        return {
            id: `row-${index}`,
            // TEXT COLUMNS
            RazonSocial: getValue(row, ['RazonSocial', 'RazonCliente', 'Cliente', 'Nombre']) || 'Desconocido',
            GEC: getValue(row, ['GEC', 'Sello', 'Clasificacion']) || 'Otros',
            GrupoCanal: getValue(row, ['GrupoCanal', 'Grupo Canal', 'Canal']) || 'Otros',
            RutaVenta: getValue(row, ['RutaVenta', 'Ruta', 'Codigo Ruta']) || 'S/R',
            RutaDesarr: getValue(row, ['RutaDesarr', 'Ruta Desarr', 'Desarrollador']) || 'S/D',
            
            // NUMBER COLUMNS (Volumenes, etc)
            UC12mm: parseNum(getValue(row, ['UC 12mm', 'UC12mm', 'Volumen', 'Venta Anual'])),
            
            YTD2025: ytd25,
            YTD2026: ytd26,
            Var2025vs2024: calculatedVar,

            // PRICES & SHARE
            TP: parseNum(getValue(row, ['TP', 'Ticket Promedio'])),
            TP_RED: parseNum(getValue(row, ['TP RED', 'TP_RED', 'TPRED'])), 
            ShareREFRESCOS: parseNum(getValue(row, ['Share REFRESCOS', 'ShareRefrescos', 'Share']), true),

            // CATEGORIES
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

export const parseExcelFile = (file: File): Promise<{ data: SalesRecord[], debugHeaders: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                
                if (jsonData.length === 0) {
                    throw new Error("El archivo parece estar vacío o no se pudo leer la primera hoja.");
                }

                // Capture headers for debugging
                const firstRow = jsonData[0] as object;
                const debugHeaders = Object.keys(firstRow);

                const sanitized = sanitizeData(jsonData);
                resolve({ data: sanitized, debugHeaders });
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

    return MOCK_DATA;
};
