import React, { useMemo, useState } from 'react';
import { SalesRecord, FilterState } from '../types';
import { 
    Treemap, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { ChevronDown, Filter, TrendingUp, TrendingDown, Package, FileWarning, RefreshCw, AlertCircle, Award, PieChart, CheckCircle, X, BarChart3 } from 'lucide-react';
import { COLORS, formatNumber } from '../constants';
import { ChatAssistant } from './ChatAssistant';
import { loadFromStorage } from '../services/dataService';

interface DashboardProps {
    data: SalesRecord[];
    onLogout: () => void;
}

// --- Local Components for Dashboard ---

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: number | null;
    isPercent?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend }) => {
    const showTrend = trend !== null && trend !== undefined;
    const isPositive = (trend || 0) >= 0;
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
                 <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{value}</span>
                {showTrend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{formatNumber(Math.abs(trend!) * 100, 1)}%</span>
                        <span className="text-gray-400 font-normal ml-1">vs año ant.</span>
                    </div>
                )}
                 {!showTrend && (
                    <div className="text-xs text-gray-400 font-medium mt-1">
                        Métrica general
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CLIENT ROW (Clickable) ---
const ClientRow: React.FC<{ client: SalesRecord; onClick: (c: SalesRecord) => void }> = ({ client, onClick }) => {
    const isGrowth = (client.Var2025vs2024 || 0) >= 0;
    
    return (
        <div 
            onClick={() => onClick(client)}
            className="px-5 py-4 hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer border-l-4 border-transparent hover:border-blue-500"
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${
                    isGrowth ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                }`}>
                    {client.RazonSocial.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors" title={client.RazonSocial}>{client.RazonSocial}</p>
                    {/* Información secundaria eliminada a petición del usuario (GEC/Canal) */}
                </div>
            </div>
            
            <div className="text-right pl-4 flex flex-col items-end">
                <p className="text-sm font-bold text-gray-900">{formatNumber(client.UC12mm, 0)} <span className="text-[10px] text-gray-400 font-normal">UC</span></p>
                <div className={`flex items-center gap-1 text-xs font-bold ${isGrowth ? 'text-green-600' : 'text-red-600'}`}>
                    {isGrowth ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatNumber(Math.abs(client.Var2025vs2024 || 0) * 100, 1)}%
                </div>
            </div>
        </div>
    );
};

// --- CLIENT DETAIL MODAL ---
interface ClientDetailModalProps {
    client: SalesRecord;
    onClose: () => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose }) => {
    const isPositive = (client.Var2025vs2024 || 0) >= 0;

    // Preparar datos para el gráfico de barras (Mix de Categorías)
    const categories = [
        { label: 'Colas', value: client.VolColas },
        { label: 'Sabores', value: client.VolSabores },
        { label: 'Agua', value: client.VolAgua },
        { label: 'Jugos', value: client.VolJugos },
        { label: 'Isotonico', value: client.VolIsotonico },
        { label: 'Energizantes', value: client.VolEnergizantes },
        { label: 'Spirits', value: client.VolSpirits },
        { label: 'Vinos', value: client.VolVinos },
    ].sort((a, b) => (b.value || 0) - (a.value || 0)).filter(c => (c.value || 0) > 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start shrink-0">
                    <div>
                         {/* UPDATE: Reemplazado GEC/Canal por Resumen de Volumen y Crecimiento */}
                         <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                                <Package className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold text-slate-700">{formatNumber(client.UC12mm, 0)} UC</span>
                            </div>
                             <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm ${isPositive ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                <span className="text-xs font-bold">{isPositive ? '+' : ''}{formatNumber(Math.abs(client.Var2025vs2024) * 100, 1)}%</span>
                            </div>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-2">{client.RazonSocial}</h2>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Ruta: <b>{client.RutaVenta}</b></span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Desarr: <b>{client.RutaDesarr}</b></span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 bg-white shadow-sm border border-slate-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto">
                     {/* KPIs Grid */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Volumen Total</p>
                            <p className="text-xl font-bold text-slate-800">{formatNumber(client.UC12mm, 0)} <span className="text-xs font-normal text-slate-400">uc</span></p>
                        </div>
                         <div className={`p-4 rounded-xl border ${client.Var2025vs2024 >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${client.Var2025vs2024 >= 0 ? 'text-green-600' : 'text-red-600'}`}>Crecimiento</p>
                            <div className="flex items-center gap-1">
                                {client.Var2025vs2024 >= 0 ? <TrendingUp className="h-4 w-4 text-green-600"/> : <TrendingDown className="h-4 w-4 text-red-600"/>}
                                <p className={`text-xl font-bold ${client.Var2025vs2024 >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {formatNumber(Math.abs(client.Var2025vs2024) * 100, 1)}%
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                            <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">Share Ref.</p>
                            <p className="text-xl font-bold text-slate-800">{formatNumber((client.ShareREFRESCOS || 0) * 100, 1)}%</p>
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Ticket Prom.</p>
                            <p className="text-xl font-bold text-slate-800">{formatNumber(client.TP_RED, 2)}</p>
                        </div>
                     </div>

                     {/* Breakdown */}
                     <div className="bg-white rounded-xl">
                        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <BarChart3 className="h-4 w-4 text-slate-400" /> Mix de Volumen por Categoría
                        </h3>
                        <div className="space-y-4">
                            {categories.map((cat, idx) => (
                                <div key={cat.label} className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-semibold text-slate-600">{cat.label}</span>
                                        <span className="text-xs font-bold text-slate-800">{formatNumber(cat.value, 0)} uc</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80" 
                                                style={{ 
                                                    width: `${Math.min(((cat.value || 0) / (client.UC12mm || 1)) * 100, 100)}%`,
                                                    backgroundColor: COLORS[idx % COLORS.length] 
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400 w-8 text-right font-medium">
                                            {formatNumber(((cat.value || 0) / (client.UC12mm || 1)) * 100, 0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// Custom render for Treemap cells (The colored rectangles)
const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, index, name } = props;
    const safeName = name || 'Sin Nombre';

    // Lógica para visibilidad:
    // width > 40 asegura espacio suficiente para al menos unas letras legibles
    const showLabel = width > 40 && height > 25;
    
    // Ajuste dinámico de longitud de texto
    // Divisor 7.5 ajustado para fuente de 12px
    const maxChars = Math.floor(width / 7.5); 
    const displayText = safeName.length > maxChars 
        ? safeName.substring(0, Math.max(0, maxChars - 3)) + '...' 
        : safeName;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[(index || 0) % COLORS.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            {showLabel ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight={600} // Semi-bold para mejor definición sin empastarse
                    style={{ pointerEvents: 'none' }} // Sin sombra (textShadow eliminado)
                >
                    {/* dy centrado verticalmente */}
                    <tspan dy=".35em">{displayText}</tspan>
                </text>
            ) : null}
        </g>
    );
};

// --- NUEVO: Tooltip Personalizado Compacto y Gris ---
const CustomTreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        // payload[0].payload contiene los datos del nodo (incluyendo la nueva propiedad growth)
        const data = payload[0].payload;
        const growth = data.growth || 0;
        const isPositive = growth >= 0;

        return (
            <div className="bg-white/95 backdrop-blur-sm p-2.5 border border-slate-100 shadow-lg rounded-md min-w-[130px] z-50">
                {/* Nombre: Texto gris oscuro, pequeño y negrita */}
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 leading-tight border-b border-slate-100 pb-1 truncate max-w-[150px]">
                    {data.name}
                </p>
                
                {/* Métricas: Estilo gris minimalista */}
                <div className="flex flex-col gap-1">
                    {/* Volumen */}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">Volumen</span>
                        <span className="text-[10px] font-bold text-slate-600">
                            {formatNumber(data.value, 0)} <span className="text-[8px] font-normal">UC</span>
                        </span>
                    </div>

                    {/* Var YTD (Growth) */}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">Var YTD</span>
                        <span className="text-[10px] font-bold text-slate-600">
                            {isPositive ? '+' : ''}{formatNumber(growth * 100, 1)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ data: initialData, onLogout }) => {
    const [localData, setLocalData] = useState<SalesRecord[]>(initialData || []);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedClient, setSelectedClient] = useState<SalesRecord | null>(null); // State for modal
    const [filters, setFilters] = useState<FilterState>({
        GEC: 'all',
        GrupoCanal: 'all',
        RutaVenta: 'all',
        RutaDesarr: 'all'
    });

    const hasData = localData && localData.length > 0;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Force true triggers the strict cloud fetch
            const freshData = await loadFromStorage(true);
            setLocalData(Array.isArray(freshData) ? freshData : []);
        } catch (e) {
            console.error("Error updating data", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Unique values for dropdowns
    const options = useMemo(() => {
        if (!hasData) return { GEC: [], GrupoCanal: [], RutaVenta: [], RutaDesarr: [] };
        return {
            GEC: Array.from(new Set(localData.map(d => d.GEC || 'S/D'))).sort(),
            GrupoCanal: Array.from(new Set(localData.map(d => d.GrupoCanal || 'S/D'))).sort(),
            RutaVenta: Array.from(new Set(localData.map(d => d.RutaVenta || 'S/D'))).sort(),
            RutaDesarr: Array.from(new Set(localData.map(d => d.RutaDesarr || 'S/D'))).sort(),
        };
    }, [localData, hasData]);

    // Filtering logic
    const filteredData = useMemo(() => {
        if (!hasData) return [];
        return localData.filter(item => {
            return (filters.GEC === 'all' || item.GEC === filters.GEC) &&
                   (filters.GrupoCanal === 'all' || item.GrupoCanal === filters.GrupoCanal) &&
                   (filters.RutaVenta === 'all' || item.RutaVenta === filters.RutaVenta) &&
                   (filters.RutaDesarr === 'all' || item.RutaDesarr === filters.RutaDesarr);
        });
    }, [localData, filters, hasData]);

    // KPI Calculations
    const kpis = useMemo(() => {
        if (filteredData.length === 0) return { totalVol: 0, totalGrowth: 0, avgShare: 0, avgTpRed: 0 };
        
        // 1. Total UC 12mm
        const totalVol = filteredData.reduce((acc, curr) => acc + (curr.UC12mm || 0), 0);
        
        // 2. Growth (Var YTD) Calculation
        // New Logic: Sum of YTD 2026 vs Sum of YTD 2025
        const sumYTD2025 = filteredData.reduce((acc, curr) => acc + (curr.YTD2025 || 0), 0);
        const sumYTD2026 = filteredData.reduce((acc, curr) => acc + (curr.YTD2026 || 0), 0);
        
        // If 2025 base is 0, we can't calculate growth (or it's infinite). We handle it safely.
        const totalGrowth = sumYTD2025 > 0 ? (sumYTD2026 / sumYTD2025) - 1 : 0;
            
        // 3. Share Refrescos: Average of clients with Share > 0
        const clientsWithShare = filteredData.filter(d => (d.ShareREFRESCOS || 0) > 0.0001);
        const avgShare = clientsWithShare.length > 0
            ? clientsWithShare.reduce((acc, curr) => acc + (curr.ShareREFRESCOS || 0), 0) / clientsWithShare.length
            : 0;

        // 4. TP RED Promedio: Average of clients with TP_RED > 0
        const clientsWithTpRed = filteredData.filter(d => (d.TP_RED || 0) > 0.0001);
        const avgTpRed = clientsWithTpRed.length > 0
            ? clientsWithTpRed.reduce((acc, curr) => acc + (curr.TP_RED || 0), 0) / clientsWithTpRed.length
            : 0;
        
        return { totalVol, totalGrowth, avgShare, avgTpRed };
    }, [filteredData]);

    // Data Preparation (Charts & Lists)
    const processedData = useMemo(() => {
        if (filteredData.length === 0) return { topClientsData: [], winners: [], losers: [] };
        
        // 1. Top 10 Clients by Volume (Treemap Data)
        const topClientsData = filteredData
            .map(d => ({ 
                name: d.RazonSocial, 
                value: d.UC12mm || 0,
                growth: d.Var2025vs2024 || 0 // Included for Tooltip
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // 2. Winners & Losers (Growth)
        // FILTER: Only show clients where GEC contains "ORO" or "DIAMANTE"
        const vipClients = filteredData.filter(d => {
            const gec = (d.GEC || '').toUpperCase();
            return gec.includes('ORO') || gec.includes('DIAMANTE');
        });

        // Sort by Growth Descending (Winners)
        const winners = [...vipClients]
            .sort((a, b) => (b.Var2025vs2024 || 0) - (a.Var2025vs2024 || 0))
            .slice(0, 5);
            
        // Sort by Growth Ascending (Losers)
        const losers = [...vipClients]
            .sort((a, b) => (a.Var2025vs2024 || 0) - (b.Var2025vs2024 || 0))
            .slice(0, 5);

        return { topClientsData, winners, losers };
    }, [filteredData]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (!hasData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md">
                    <FileWarning className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Sin Datos Disponibles</h2>
                    <p className="text-gray-500 mb-6">
                        No se han encontrado registros de ventas. Ingrese como Administrador para cargar el archivo Excel mensual.
                    </p>
                    <button onClick={onLogout} className="text-blue-600 font-medium hover:underline">
                        Volver al Login
                    </button>
                    <button 
                        onClick={handleRefresh}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                         {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                         Intentar Reconexión
                    </button>
                </div>
            </div>
        );
    }

    return (
        // Changed bg-slate-50 to bg-gray-50 for lighter/neutral tone
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div>
                    {/* Updated Font */}
                    <h1 className="text-base font-tech font-bold text-gray-900 leading-tight tracking-wider uppercase">
                        SalesComander <span className="text-blue-600">Pro</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-gray-500 font-medium">Online v1.2</p>
                        
                        <button 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="ml-2 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded border border-blue-200 transition-colors"
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? '...' : 'Sync'}
                        </button>
                    </div>
                </div>
                <button onClick={onLogout} className="text-xs font-medium text-gray-600 hover:text-red-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                    Salir
                </button>
            </header>

            {/* Filters */}
            <section className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                    <Filter className="h-4 w-4 text-blue-600" /> Filtros Activos
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(options) as Array<keyof FilterState>).map((key) => (
                        <div key={key} className="relative">
                            <select
                                value={filters[key]}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                className="appearance-none block w-full text-xs font-medium border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2.5 pl-3 pr-8 text-gray-700 truncate"
                            >
                                <option value="all">Todas: {key}</option>
                                {options[key].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </section>

            <main className="p-4 space-y-6 max-w-7xl mx-auto">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
                    <KpiCard 
                        title="Volumen (UC)" 
                        value={formatNumber(kpis.totalVol, 0)} 
                        icon={<Package className="h-5 w-5 text-blue-600" />}
                        trend={null}
                    />
                    <KpiCard 
                        title="var YTD" 
                        value={`${formatNumber(kpis.totalGrowth * 100, 1)}%`} 
                        icon={kpis.totalGrowth >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                        trend={kpis.totalGrowth}
                        isPercent
                    />
                    <KpiCard 
                        title="Share Refrescos" 
                        value={`${formatNumber(kpis.avgShare * 100, 1)}%`} 
                        icon={<PieChart className="h-5 w-5 text-purple-600" />}
                        trend={null}
                    />
                     <KpiCard 
                        title="TP RED Prom." 
                        value={`${formatNumber(kpis.avgTpRed * 100, 1)}%`} 
                        icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
                        trend={null}
                    />
                </div>

                {/* Charts & Lists Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Clients Treemap */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700">Top 10 Clientes (Volumen UC)</h3>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={processedData.topClientsData}
                                    dataKey="value"
                                    aspectRatio={4 / 3}
                                    stroke="#fff"
                                    fill="#8884d8"
                                    content={<CustomizedTreemapContent />}
                                >
                                    {/* USAMOS EL TOOLTIP PERSONALIZADO AQUI */}
                                    <RechartsTooltip 
                                        content={<CustomTreemapTooltip />}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Winners & Losers Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-700">Ranking Oro / Diamante</h3>
                            <p className="text-[10px] text-gray-400">Filtrado por GEC: "ORO" o "DIAMANTE"</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            
                            {/* Winners */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-100">
                                    <Award className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Top 5 Ganadores</span>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {processedData.winners.length > 0 ? (
                                        processedData.winners.map((client, idx) => {
                                            const diff = (client.YTD2026 || 0) - (client.YTD2025 || 0);
                                            return (
                                                <div key={client.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 group hover:bg-gray-50 rounded-lg transition-colors px-1">
                                                    <div className="flex items-start gap-3 overflow-hidden">
                                                        <span className="flex-shrink-0 w-7 h-7 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex flex-col">
                                                            <div className="text-sm font-bold text-gray-800 truncate uppercase leading-tight" title={client.RazonSocial}>
                                                                {client.RazonSocial.length > 18 ? client.RazonSocial.substring(0, 18) + '...' : client.RazonSocial}
                                                            </div>
                                                            <div className="text-xs font-medium text-gray-500 mt-1">
                                                                {diff > 0 ? '+' : ''}{formatNumber(diff, 0)} UC
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md ml-2 shrink-0">
                                                        +{formatNumber(client.Var2025vs2024 * 100, 1)}%
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs py-4 text-center">
                                            <Award className="h-6 w-6 mb-1 opacity-20" />
                                            Sin clientes Oro/Diamante<br/>con crecimiento positivo
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Losers */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-100">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Top 5 Críticos</span>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {processedData.losers.length > 0 ? (
                                        processedData.losers.map((client, idx) => {
                                            const diff = (client.YTD2026 || 0) - (client.YTD2025 || 0);
                                            return (
                                                <div key={client.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 group hover:bg-gray-50 rounded-lg transition-colors px-1">
                                                    <div className="flex items-start gap-3 overflow-hidden">
                                                        <span className="flex-shrink-0 w-7 h-7 bg-red-50 text-red-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex flex-col">
                                                            <div className="text-sm font-bold text-gray-800 truncate uppercase leading-tight" title={client.RazonSocial}>
                                                                {client.RazonSocial.length > 18 ? client.RazonSocial.substring(0, 18) + '...' : client.RazonSocial}
                                                            </div>
                                                            <div className="text-xs font-medium text-gray-500 mt-1">
                                                                {diff > 0 ? '+' : ''}{formatNumber(diff, 0)} UC
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs font-bold px-2 py-1 rounded-md ml-2 shrink-0 ${client.Var2025vs2024 < 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                                                        {formatNumber(client.Var2025vs2024 * 100, 1)}%
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs py-4 text-center">
                                            <AlertCircle className="h-6 w-6 mb-1 opacity-20" />
                                            Sin registros críticos<br/>en segmento Oro/Diamante
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Client List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Listado de Clientes</h3>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                            {filteredData.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredData.map((client) => (
                            <ClientRow 
                                key={client.id} 
                                client={client} 
                                onClick={setSelectedClient} 
                            />
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal de Detalle de Cliente */}
            {selectedClient && (
                <ClientDetailModal 
                    client={selectedClient} 
                    onClose={() => setSelectedClient(null)} 
                />
            )}

            <ChatAssistant data={filteredData} />
        </div>
    );
};