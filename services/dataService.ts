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
        TP: Number(row['TP'] || 0)
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
 * DATABASE OPERATIONS (SERVERLESS API)
 * Now uses the /api/sales endpoint to ensure a Single Source of Truth.
 */

export const saveToStorage = async (data: SalesRecord[]): Promise<void> => {
    // 1. Optimistic update: Save to LocalStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    try {
        console.log("Syncing with Cloud Database...");
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud Upload Failed: ${response.status} ${errorText}`);
        }
        
        console.log("Cloud Sync Success");
    } catch (error) {
        console.error("Failed to sync to cloud:", error);
        throw error; // Propagate error so Admin knows it failed
    }
};

export const loadFromStorage = async (): Promise<SalesRecord[]> => {
    // 1. Always try to fetch fresh data from the API first
    try {
        console.log("Fetching fresh data from Cloud API...");
        const response = await fetch('/api/sales', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache' // Tell server we want fresh data
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
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Local storage corrupted");
        }
    }

    // 3. Fallback to Mock Data if completely empty
    console.log("No data found anywhere, using MOCK_DATA");
    return MOCK_DATA;
};