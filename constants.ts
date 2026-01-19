import { SalesRecord } from "./types";

export const MOCK_DATA: SalesRecord[] = [
    { id: '1', RazonSocial: 'SUPERMERCADO CENTRAL', GEC: 'MODERNO', GrupoCanal: 'SUPERMERCADOS', RutaVenta: 'R-101', RutaDesarr: 'JUAN PEREZ', UC12mm: 1200, Var2025vs2024: 0.05, ShareREFRESCOS: 0.45, TP: 150 },
    { id: '2', RazonSocial: 'MINIMARKET EL SOL', GEC: 'TRADICIONAL', GrupoCanal: 'BODEGAS', RutaVenta: 'R-102', RutaDesarr: 'MARIA GOMEZ', UC12mm: 450, Var2025vs2024: -0.02, ShareREFRESCOS: 0.30, TP: 45 },
    { id: '3', RazonSocial: 'TIENDA DON PEPE', GEC: 'TRADICIONAL', GrupoCanal: 'BODEGAS', RutaVenta: 'R-101', RutaDesarr: 'JUAN PEREZ', UC12mm: 300, Var2025vs2024: 0.12, ShareREFRESCOS: 0.60, TP: 30 },
    { id: '4', RazonSocial: 'RESTAURANTE LA BRASA', GEC: 'ON PREMISE', GrupoCanal: 'RESTAURANTES', RutaVenta: 'R-103', RutaDesarr: 'CARLOS RUIZ', UC12mm: 800, Var2025vs2024: 0.08, ShareREFRESCOS: 0.75, TP: 200 },
    { id: '5', RazonSocial: 'LICORERIA EXPRESS', GEC: 'TRADICIONAL', GrupoCanal: 'LICORERIAS', RutaVenta: 'R-102', RutaDesarr: 'MARIA GOMEZ', UC12mm: 600, Var2025vs2024: 0.15, ShareREFRESCOS: 0.25, TP: 120 },
    { id: '6', RazonSocial: 'GRIFO PRIMAX', GEC: 'MODERNO', GrupoCanal: 'CONVENIENCE', RutaVenta: 'R-103', RutaDesarr: 'CARLOS RUIZ', UC12mm: 950, Var2025vs2024: 0.03, ShareREFRESCOS: 0.55, TP: 80 },
];

// In a real Next.js app, these would be process.env vars.
// For this demo, we use hardcoded fallbacks if env is missing to ensure functionality.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
export const VIEWER_PASSWORD = process.env.NEXT_PUBLIC_VIEWER_PASSWORD || 'sales2024';

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
