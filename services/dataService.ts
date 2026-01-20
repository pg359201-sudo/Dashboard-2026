import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA, BLOB_TOKEN } from '../constants';

const LOCAL_STORAGE_KEY = 'sales_commander_data';
const DB_FILENAME = 'sales_db.json';

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
 * DATABASE OPERATIONS (VERCEL BLOB)
 * We use the REST API directly since we are in a pure client-side environment.
 */

export const saveToStorage = async (data: SalesRecord[]): Promise<void> => {
    // 1. Try Vercel Blob if token exists
    if (BLOB_TOKEN) {
        try {
            console.log("Saving to Cloud Database (Vercel Blob)...");
            const response = await fetch(`https://blob.vercel-storage.com/${DB_FILENAME}`, {
                method: 'PUT',
                headers: {
                    'authorization': `Bearer ${BLOB_TOKEN}`,
                    'x-add-random-suffix': 'false', // Keep filename constant to act as a DB
                    'content-type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to upload to Blob');
            console.log("Cloud Save Success");
        } catch (error) {
            console.error("Cloud Save Failed, falling back to local:", error);
        }
    }

    // 2. Always save to LocalStorage as cache/fallback
    return new Promise((resolve) => {
        setTimeout(() => {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
            resolve();
        }, 500);
    });
};

export const loadFromStorage = async (): Promise<SalesRecord[]> => {
    // 1. Try Vercel Blob first (Source of Truth)
    if (BLOB_TOKEN) {
        try {
            // We need to list files to find the URL of our DB file, or construct it if public.
            // For simplicity in this demo, we assume we can list the blob to get the latest url.
            const listRes = await fetch(`https://blob.vercel-storage.com?limit=100`, {
                method: 'GET',
                headers: { 'authorization': `Bearer ${BLOB_TOKEN}` },
            });
            
            if (listRes.ok) {
                const listData = await listRes.json();
                const dbFile = listData.blobs.find((b: any) => b.pathname === DB_FILENAME);
                
                if (dbFile && dbFile.url) {
                    console.log("Downloading from Cloud Database...", dbFile.url);
                    const dbRes = await fetch(dbFile.url);
                    const dbJson = await dbRes.json();
                    
                    // Update local cache
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbJson));
                    return dbJson;
                }
            }
        } catch (error) {
            console.warn("Cloud Load Failed, checking local cache:", error);
        }
    }

    // 2. Fallback to LocalStorage
    return new Promise((resolve) => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            resolve(JSON.parse(stored));
        } else {
            console.log("No data found, using MOCK_DATA");
            resolve(MOCK_DATA);
        }
    });
};