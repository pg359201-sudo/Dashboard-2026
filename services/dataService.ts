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
 * Improved for caching and error handling.
 */

export const saveToStorage = async (data: SalesRecord[]): Promise<void> => {
    // 1. Always save to LocalStorage first as immediate backup
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    // 2. Try Vercel Blob if token exists
    if (BLOB_TOKEN) {
        console.log("Saving to Cloud Database (Vercel Blob)...");
        const response = await fetch(`https://blob.vercel-storage.com/${DB_FILENAME}`, {
            method: 'PUT',
            headers: {
                'authorization': `Bearer ${BLOB_TOKEN}`,
                'x-add-random-suffix': 'false', // Attempt to overwrite/keep filename
                'content-type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            // Re-throw error so AdminPanel knows it failed
            const errorText = await response.text();
            throw new Error(`Cloud Upload Failed: ${response.status} ${errorText}`);
        }
        console.log("Cloud Save Success");
    } else {
        console.warn("No BLOB_TOKEN found. Data saved to LocalStorage only.");
    }
};

export const loadFromStorage = async (): Promise<SalesRecord[]> => {
    // 1. Try Vercel Blob first (Source of Truth)
    if (BLOB_TOKEN) {
        try {
            // List files. Add cache: 'no-store' to ensure we get the latest list.
            const listRes = await fetch(`https://blob.vercel-storage.com?limit=100`, {
                method: 'GET',
                headers: { 'authorization': `Bearer ${BLOB_TOKEN}` },
                cache: 'no-store'
            });
            
            if (listRes.ok) {
                const listData = await listRes.json();
                
                // Find the DB file. 
                // Sort by uploadedAt (descending) to get the absolute latest version if duplicates exist.
                const blobs = listData.blobs || [];
                const dbFile = blobs
                    .filter((b: any) => b.pathname.endsWith(DB_FILENAME))
                    .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .pop(); // Use pop() if sorting asc, or logic above. Let's fix logic:
                
                // Correct Sort: Newest first
                const latestFile = blobs
                    .filter((b: any) => b.pathname.includes(DB_FILENAME))
                    .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .reverse()[0];

                if (latestFile && latestFile.url) {
                    console.log("Downloading from Cloud Database...", latestFile.url);
                    
                    // Add timestamp to query to BYPASS BROWSER CACHE
                    const cacheBuster = `?t=${new Date().getTime()}`;
                    const dbRes = await fetch(latestFile.url + cacheBuster, {
                        cache: 'no-store'
                    });
                    
                    if (dbRes.ok) {
                        const dbJson = await dbRes.json();
                        // Update local cache
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbJson));
                        return dbJson;
                    }
                }
            }
        } catch (error) {
            console.warn("Cloud Load Failed, checking local cache:", error);
        }
    }

    // 2. Fallback to LocalStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Local storage corrupted");
        }
    }

    console.log("No data found, using MOCK_DATA");
    return MOCK_DATA;
};