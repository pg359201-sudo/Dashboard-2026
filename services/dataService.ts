import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';

// Helper to sanitize keys from Excel
const sanitizeData = (rawData: any[]): SalesRecord[] => {
    return rawData.map((row, index) => ({
        id: `row-${index}`,
        RazonSocial: row['RazonSocial'] || row['Cliente'] || 'Desconocido',
        GEC: row['GEC'] || 'Otros',
        GrupoCanal: row['GrupoCanal'] || row['Subcanal'] || 'Otros',
        RutaVenta: row['RutaVenta'] || row['Ruta'] || 'S/R',
        RutaDesarr: row['RutaDesarr'] || row['Desarrollador'] || 'S/D',
        UC12mm: Number(row['UC 12mm'] || row['Volumen'] || 0),
        Var2025vs2024: Number(row['Var 2025 vs 2024'] || row['Crecimiento'] || 0),
        ShareREFRESCOS: Number(row['Share REFRESCOS'] || row['Share'] || 0),
        TP: Number(row['TP'] || 0),
        TP_RED: Number(row['TP RED'] || row['TP_RED'] || 0),

        // Parsing detailed product categories based on header image
        VolColas: Number(row['COLAS'] || 0),
        VolSabores: Number(row['SABORES'] || 0),
        VolAgua: Number(row['AGUA PLAIN'] || row['AGUA'] || 0),
        VolSaborizadas: Number(row['SABORIZADAS'] || 0),
        VolJugos: Number(row['JUGOS'] || 0),
        VolIsotonico: Number(row['ISOTÓNICO'] || row['ISOTONICO'] || 0),
        VolEnergizantes: Number(row['ENERGIZANTES'] || 0),
        VolSpirits: Number(row['SPIRITS'] || 0),
        VolVinos: Number(row['VINOS'] || 0)
    }));
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