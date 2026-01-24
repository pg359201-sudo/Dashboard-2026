import React, { useMemo, useState } from 'react';
import { SalesRecord, FilterState } from '../types';
import { 
    Treemap, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { ChevronDown, Filter, TrendingUp, TrendingDown, Package, FileWarning, RefreshCw, AlertCircle, Award, PieChart, CheckCircle, ChevronUp, BarChart3, Layers, Zap, Target, Trophy } from 'lucide-react';
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
            <div className="flex justify-between items-center mb-2 gap-2">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{title}</h3>
                 <div className="p-1 bg-white rounded-lg">{icon}</div>
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
            </div>
        </div>
    );
};

// --- CLIENT ROW (Accordion Style) ---
interface ClientRowProps {
    client: SalesRecord;
    isExpanded: boolean;
    onToggle: () => void;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, isExpanded, onToggle }) => {
    const isGrowth = (client.Var2025vs2024 || 0) >= 0;

    // Helper para colores específicos solicitados
    const getCategoryColor = (label: string) => {
        const normalized = label.toLowerCase();
        if (normalized.includes('agua')) return '#7dd3fc'; // Celeste claro
        if (normalized.includes('jugos')) return '#f97316'; // Naranja
        if (normalized.includes('isotonico')) return '#1d4ed8'; // Azul Fuerte (Blue-700)
        if (normalized.includes('vinos')) return '#8b5cf6'; // Violeta
        if (normalized.includes('energizantes')) return '#22c55e'; // Verde ajustado
        if (normalized.includes('spirits')) return '#fdba74'; // Naranja claro
        return '#cbd5e1'; // Default gris
    };

    // Preparar datos para el listado de Mix
    const categories = useMemo(() => {
        if (!isExpanded) return [];
        
        // Categorías a EXCLUIR según solicitud: Colas, Sabores, Saborizadas
        const excludedCategories = ['Colas', 'Sabores', 'Saborizadas'];

        return [
            { label: 'Colas', value: client.VolColas },
            { label: 'Sabores', value: client.VolSabores },
            { label: 'Saborizadas', value: client.VolSaborizadas },
            { label: 'Agua', value: client.VolAgua },
            { label: 'Jugos', value: client.VolJugos },
            { label: 'Isotonico', value: client.VolIsotonico },
            { label: 'Energizantes', value: client.VolEnergizantes },
            { label: 'Spirits', value: client.VolSpirits },
            { label: 'Vinos', value: client.VolVinos },
        ]
        .filter(c => !excludedCategories.includes(c.label)) // FILTRO DE EXCLUSIÓN
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .filter(c => (c.value || 0) > 0);
    }, [isExpanded, client]);
    
    // Share Calculation
    const shareVal = (client.ShareREFRESCOS || 0) * 100;
    const tpRedVal = (client.TP_RED || 0) * 100;

    return (
        <div className="border-b border-gray-100 last:border-0">
            {/* Header (Always Visible) */}
            <div 
                onClick={onToggle}
                className={`px-5 py-4 cursor-pointer transition-colors flex items-center justify-between group border-l-4 ${
                    isExpanded ? 'bg-blue-50/50 border-blue-500' : 'hover:bg-gray-50 border-transparent hover:border-blue-300'
                }`}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${
                        isGrowth ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                        {client.RazonSocial.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors" title={client.RazonSocial}>
                            {client.RazonSocial}
                        </p>
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

            {/* Expanded Content (Ultra Compact & Minimalist) */}
            {isExpanded && (
                <div className="bg-slate-50 px-3 py-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* LEFT: Info & Bars */}
                        <div className="flex flex-col gap-2">
                            {/* Metadata Compacta */}
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 text-xs w-full justify-around">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] uppercase font-bold text-slate-400">Ruta</span>
                                        <span className="font-bold text-slate-700">{client.RutaVenta}</span>
                                    </div>
                                    <div className="w-px h-5 bg-slate-200"></div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] uppercase font-bold text-slate-400">Desarrollador</span>
                                        <span className="font-bold text-slate-700">{client.RutaDesarr}</span>
                                    </div>
                                </div>
                            </div>

                             {/* TP RED Bar (Solo Dorado Sólido) */}
                             <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <Trophy className="h-3 w-3 text-amber-500" /> TP RED
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 leading-none">
                                        {formatNumber(tpRedVal, 1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${Math.min(tpRedVal, 100)}%`,
                                            backgroundColor: '#f59e0b' // Dorado Sólido (Amber-500)
                                        }} 
                                    />
                                </div>
                            </div>
                            
                            {/* Share Refrescos Bar (Solo Roja Sólida) */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                        <PieChart className="h-3 w-3 text-red-500" /> Share Refrescos
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 leading-none">
                                        {formatNumber(shareVal, 1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${Math.min(shareVal, 100)}%`,
                                            backgroundColor: '#dc2626' // Rojo Sólido (Red-600)
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Mix Grid (3 Columns) */}
                        <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1 tracking-wider">
                                <Layers className="h-3 w-3" /> Mix Estratégico
                            </p>
                            
                            {categories.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map((cat, idx) => {
                                        const percent = ((cat.value || 0) / (client.UC12mm || 1)) * 100;
                                        return (
                                            <div key={cat.label} className="bg-white border border-slate-100 rounded-md p-2 shadow-sm flex flex-col justify-between h-14 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(cat.label) }}></div>
                                                    <span className="text-[9px] font-semibold text-slate-500 truncate">{cat.label}</span>
                                                </div>
                                                {/* UC a la derecha y en la misma fila que el % */}
                                                <div className="flex items-end justify-between w-full mt-1">
                                                    <span className="text-xs font-bold text-slate-800 leading-none">
                                                        {formatNumber(percent, 1)}<span className="text-[8px] text-slate-400">%</span>
                                                    </span>
                                                    <span className="text-[9px] font-medium text-slate-400">
                                                        {formatNumber(cat.value, 0)} UC
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-400 italic bg-slate-100 p-2 rounded-lg text-center">
                                    Sin volumen estratégico.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null); // State for accordion
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

    const handleToggleClient = (id: string) => {
        setExpandedClientId(prev => prev === id ? null : id);
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
                        icon={<Package className="h-4 w-4 text-blue-600" />}
                        trend={null}
                    />
                    <KpiCard 
                        title="var YTD" 
                        value={`${formatNumber(kpis.totalGrowth * 100, 1)}%`} 
                        icon={kpis.totalGrowth >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                        trend={kpis.totalGrowth}
                        isPercent
                    />
                    <KpiCard 
                        title="Share Refrescos" 
                        value={`${formatNumber(kpis.avgShare * 100, 1)}%`} 
                        icon={<PieChart className="h-4 w-4 text-red-600" />}
                        trend={null}
                    />
                     <KpiCard 
                        title="TP RED Prom." 
                        value={`${formatNumber(kpis.avgTpRed * 100, 1)}%`} 
                        icon={<Trophy className="h-4 w-4 text-amber-500" />}
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
                                isExpanded={expandedClientId === client.id}
                                onToggle={() => handleToggleClient(client.id)}
                            />
                        ))}
                    </div>
                </div>
            </main>

            <ChatAssistant data={filteredData} />
        </div>
    );
};