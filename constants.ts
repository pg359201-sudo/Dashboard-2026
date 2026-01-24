import { SalesRecord } from "./types";

export const MOCK_DATA: SalesRecord[] = [
    { 
        id: '1', RazonSocial: 'SUPERMERCADO CENTRAL', GEC: '51 - ORO', GrupoCanal: 'SUPERMERCADOS', RutaVenta: 'R-101', RutaDesarr: 'JUAN PEREZ', 
        UC12mm: 1200, YTD2025: 1100, YTD2026: 1155, Var2025vs2024: 0.05, 
        ShareREFRESCOS: 0.45, TP: 150, TP_RED: 0.85,
        VolColas: 600, VolSabores: 300, VolAgua: 100, VolSaborizadas: 50, VolJugos: 50, VolIsotonico: 50, VolEnergizantes: 20, VolSpirits: 10, VolVinos: 20
    },
    { 
        id: '2', RazonSocial: 'MINIMARKET EL SOL', GEC: '50 - DIAMANTE', GrupoCanal: 'BODEGAS', RutaVenta: 'R-102', RutaDesarr: 'MARIA GOMEZ', 
        UC12mm: 450, YTD2025: 400, YTD2026: 392, Var2025vs2024: -0.02, 
        ShareREFRESCOS: 0.30, TP: 45, TP_RED: 0.72,
        VolColas: 200, VolSabores: 150, VolAgua: 50, VolSaborizadas: 20, VolJugos: 10, VolIsotonico: 10, VolEnergizantes: 5, VolSpirits: 0, VolVinos: 5
    },
    { 
        id: '3', RazonSocial: 'TIENDA DON PEPE', GEC: 'TRADICIONAL', GrupoCanal: 'BODEGAS', RutaVenta: 'R-101', RutaDesarr: 'JUAN PEREZ', 
        UC12mm: 300, YTD2025: 250, YTD2026: 280, Var2025vs2024: 0.12, 
        ShareREFRESCOS: 0.60, TP: 30, TP_RED: 0.632,
        VolColas: 150, VolSabores: 100, VolAgua: 30, VolSaborizadas: 10, VolJugos: 5, VolIsotonico: 0, VolEnergizantes: 5, VolSpirits: 0, VolVinos: 0
    },
    { 
        id: '4', RazonSocial: 'RESTAURANTE LA BRASA', GEC: '51 - ORO', GrupoCanal: 'RESTAURANTES', RutaVenta: 'R-103', RutaDesarr: 'CARLOS RUIZ', 
        UC12mm: 800, YTD2025: 700, YTD2026: 756, Var2025vs2024: 0.08, 
        ShareREFRESCOS: 0.75, TP: 200, TP_RED: 0.91,
        VolColas: 500, VolSabores: 100, VolAgua: 100, VolSaborizadas: 0, VolJugos: 20, VolIsotonico: 0, VolEnergizantes: 0, VolSpirits: 50, VolVinos: 30
    },
    { 
        id: '5', RazonSocial: 'LICORERIA EXPRESS', GEC: 'TRADICIONAL', GrupoCanal: 'LICORERIAS', RutaVenta: 'R-102', RutaDesarr: 'MARIA GOMEZ', 
        UC12mm: 600, YTD2025: 500, YTD2026: 575, Var2025vs2024: 0.15, 
        ShareREFRESCOS: 0.25, TP: 120, TP_RED: 0.45,
        VolColas: 100, VolSabores: 50, VolAgua: 20, VolSaborizadas: 30, VolJugos: 50, VolIsotonico: 50, VolEnergizantes: 100, VolSpirits: 150, VolVinos: 50
    },
    { 
        id: '6', RazonSocial: 'GRIFO PRIMAX', GEC: '50 - DIAMANTE', GrupoCanal: 'CONVENIENCE', RutaVenta: 'R-103', RutaDesarr: 'CARLOS RUIZ', 
        UC12mm: 950, YTD2025: 900, YTD2026: 927, Var2025vs2024: 0.03, 
        ShareREFRESCOS: 0.55, TP: 80, TP_RED: 0.55,
        VolColas: 300, VolSabores: 200, VolAgua: 200, VolSaborizadas: 100, VolJugos: 50, VolIsotonico: 50, VolEnergizantes: 50, VolSpirits: 0, VolVinos: 0
    },
];

/**
 * Helper to safely access environment variables.
 * Checks import.meta.env (Vite) first, then process.env (Node/Webpack).
 */
const getEnv = (key: string, fallback: string): string => {
    // Check Vite style
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) { /* ignore */ }

    // Check Node/Process style safely
    try {
        // We use a safe check for 'process' existence
        if (typeof process !== 'undefined' && process && process.env) {
            return process.env[key] || fallback;
        }
    } catch (e) { /* ignore */ }
    
    return fallback;
};

// Use NEXT_PUBLIC_ prefix which is standard for exposing env vars to the browser
export const ADMIN_PASSWORD = getEnv('NEXT_PUBLIC_ADMIN_PASSWORD', 'admin123');
export const VIEWER_PASSWORD = getEnv('NEXT_PUBLIC_VIEWER_PASSWORD', 'sales2024');
export const GEMINI_API_KEY = getEnv('NEXT_PUBLIC_GEMINI_API_KEY', '');
export const BLOB_TOKEN = getEnv('NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN', '');

// Updated Pastel Palette for a softer, modern look
export const COLORS = [
    '#93C5FD', // Soft Blue (Blue-300)
    '#6EE7B7', // Soft Emerald (Emerald-300)
    '#FDE047', // Soft Yellow (Yellow-300)
    '#FDBA74', // Soft Orange (Orange-300)
    '#C4B5FD', // Soft Violet (Violet-300)
    '#86EFAC', // Soft Green (Green-300)
    '#F9A8D4', // Soft Pink (Pink-300)
    '#67E8F9', // Soft Cyan (Cyan-300)
    '#FDA4AF'  // Soft Rose (Rose-300)
];

/**
 * Formatea un número al estilo Latino/Español.
 * - Separador de miles: Punto (.)
 * - Separador decimal: Coma (,)
 * Ejemplo: 1000.50 -> "1.000,50"
 */
export const formatNumber = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};