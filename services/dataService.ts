import * as XLSX from 'xlsx';
import { SalesRecord } from '../types';
import { MOCK_DATA } from '../constants';

const STORAGE_KEY = 'sales_commander_data';

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

// Simulation of Vercel Blob (using LocalStorage for client-side demo persistence)
export const saveToStorage = async (data: SalesRecord[]): Promise<void> => {
    // In a real app using @vercel/blob:
    // const blob = await put('sales-data.json', JSON.stringify(data), { access: 'public' });
    // return blob.url;
    
    // Using LocalStorage for immediate functional demo:
    return new Promise((resolve) => {
        setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            resolve();
        }, 800);
    });
};

export const loadFromStorage = async (): Promise<SalesRecord[]> => {
    // In a real app: fetch(blobUrl).then(res => res.json())
    
    return new Promise((resolve) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            resolve(JSON.parse(stored));
        } else {
            resolve(MOCK_DATA); // Fallback to mock data if empty
        }
    });
};
