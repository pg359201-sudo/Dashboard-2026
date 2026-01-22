
export interface SalesRecord {
    id: string;
    RazonSocial: string;
    GEC: string; // Grouping category
    GrupoCanal: string; // Subchannel
    RutaVenta: string; // Route
    RutaDesarr: string; // Developer/Agent
    UC12mm: number; // Unit Case 12 month moving (Total)
    
    // New Structure for Growth Calculation
    YTD2025: number; // Volume YTD Previous Year
    YTD2026: number; // Volume YTD Current Year
    Var2025vs2024: number; // Calculated Growth percentage (YTD26 / YTD25 - 1)
    
    ShareREFRESCOS: number; // Market Share
    TP: number; // Average Ticket Price (Ticket Promedio)
    TP_RED: number; // Ticket Promedio Red
    
    // New breakdown categories
    VolColas: number;
    VolSabores: number;
    VolAgua: number;
    VolSaborizadas: number;
    VolJugos: number;
    VolIsotonico: number;
    VolEnergizantes: number;
    VolSpirits: number;
    VolVinos: number;
}

export interface UserSession {
    role: 'admin' | 'viewer' | null;
    isAuthenticated: boolean;
}

export type FilterState = {
    GEC: string | 'all';
    GrupoCanal: string | 'all';
    RutaVenta: string | 'all';
    RutaDesarr: string | 'all';
};

export interface ChartData {
    name: string;
    value: number;
}
