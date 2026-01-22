import React, { useMemo, useState } from 'react';
import { SalesRecord, FilterState } from '../types';
import { 
    Treemap, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { ChevronDown, Filter, TrendingUp, TrendingDown, Package, FileWarning, RefreshCw, AlertCircle, Award, PieChart } from 'lucide-react';
import { COLORS } from '../constants';
import { ChatAssistant } from './ChatAssistant';
import { loadFromStorage } from '../services/dataService';

interface DashboardProps {
    data: SalesRecord[];
    onLogout: () => void;
}

// Custom render for Treemap cells
const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, index, name, value } = props;
    const safeName = name || 'Sin Nombre';

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
            {width > 60 && height > 40 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    <tspan x={x + width / 2} dy="-0.6em">{safeName.length > 12 ? safeName.substring(0, 12) + '...' : safeName}</tspan>
                    <tspan x={x + width / 2} dy="1.2em">{Number(value).toLocaleString()}</tspan>
                </text>
            ) : null}
        </g>
    );
};

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: number | null;
    isPercent?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend, isPercent }) => {
    let trendColor = 'text-slate-400';
    let trendIcon = null;

    if (trend !== null) {
        if (trend > 0) {
            trendColor = 'text-green-600';
            trendIcon = <TrendingUp className="h-3 w-3" />;
        } else if (trend < 0) {
            trendColor = 'text-red-600';
            trendIcon = <TrendingDown className="h-3 w-3" />;
        }
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
                <div className="p-2 bg-slate-50 rounded-lg">
                    {icon}
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-800">{value}</span>
                {trend !== null && (
                    <span className={`flex items-center gap-1 text-xs font-bold mb-1 ${trendColor} bg-slate-50 px-2 py-0.5 rounded`}>
                        {trendIcon}
                        {trend > 0 ? '+' : ''}{isPercent ? (trend * 100).toFixed(1) + '%' : trend}
                    </span>
                )}
            </div>
        </div>
    );
};

interface ClientRowProps {
    client: SalesRecord;
}

const ClientRow: React.FC<ClientRowProps> = ({ client }) => {
    return (
        <div className="px-5 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                    {client.RazonSocial.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate" title={client.RazonSocial}>
                        {client.RazonSocial}
                    </div>
                    <div className="text-xs text-slate-400 flex gap-2 items-center">
                        <span className="bg-slate-100 px-1.5 rounded text-[10px] font-medium">{client.GEC}</span>
                        <span>•</span>
                        <span className="truncate">{client.RutaVenta}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6 text-right shrink-0 ml-4">
                <div className="hidden sm:block">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Volumen</div>
                    <div className="text-sm font-bold text-slate-700">{Number(client.UC12mm).toLocaleString()}</div>
                </div>
                
                <div className="hidden sm:block w-20">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Growth</div>
                    <div className={`text-sm font-bold ${(client.Var2025vs2024 || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(client.Var2025vs2024 || 0) > 0 ? '+' : ''}{((client.Var2025vs2024 || 0) * 100).toFixed(1)}%
                    </div>
                </div>

                <div className="w-16 flex justify-end">
                     <div className={`text-xs font-bold px-2 py-1 rounded-md ${(client.ShareREFRESCOS || 0) > 0.5 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {((client.ShareREFRESCOS || 0) * 100).toFixed(0)}%
                     </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ data: initialData, onLogout }) => {
    const [localData, setLocalData] = useState<SalesRecord[]>(initialData || []);
    const [isRefreshing, setIsRefreshing] = useState(false);
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
        if (filteredData.length === 0) return { totalVol: 0, totalGrowth: 0, avgShare: 0 };
        
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
        
        return { totalVol, totalGrowth, avgShare };
    }, [filteredData]);

    // Data Preparation (Charts & Lists)
    const processedData = useMemo(() => {
        if (filteredData.length === 0) return { topClientsData: [], winners: [], losers: [] };
        
        // 1. Top 10 Clients by Volume (Treemap Data)
        const topClientsData = filteredData
            .map(d => ({ name: d.RazonSocial, value: d.UC12mm || 0 }))
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <FileWarning className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Sin Datos Disponibles</h2>
                    <p className="text-slate-500 mb-6">
                        No se han encontrado registros de ventas. Ingrese como Administrador para cargar el archivo Excel mensual.
                    </p>
                    <button onClick={onLogout} className="text-blue-600 font-medium hover:underline">
                        Volver al Login
                    </button>
                    <button 
                        onClick={handleRefresh}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                         {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                         Intentar Reconexión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">SalesComander Pro</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Online</p>
                        
                        {/* Refresh Button */}
                        <button 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="ml-2 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded border border-blue-200 transition-colors"
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
                        </button>
                    </div>
                </div>
                <button onClick={onLogout} className="text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    Salir
                </button>
            </header>

            {/* Filters */}
            <section className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
                    <Filter className="h-4 w-4 text-blue-600" /> Filtros Activos
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(options) as Array<keyof FilterState>).map((key) => (
                        <div key={key} className="relative">
                            <select
                                value={filters[key]}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                className="appearance-none block w-full text-xs font-medium border-slate-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 py-2.5 pl-3 pr-8 text-slate-700 truncate"
                            >
                                <option value="all">Todas: {key}</option>
                                {options[key].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </section>

            <main className="p-4 space-y-6 max-w-7xl mx-auto">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard 
                        title="Volumen Total (UC)" 
                        value={kpis.totalVol.toLocaleString('es-PE', { maximumFractionDigits: 0 })} 
                        icon={<Package className="h-5 w-5 text-blue-600" />}
                        trend={null}
                    />
                    <KpiCard 
                        title="var YTD" 
                        value={`${(kpis.totalGrowth * 100).toFixed(1)}%`} 
                        icon={kpis.totalGrowth >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                        trend={kpis.totalGrowth}
                        isPercent
                    />
                    <KpiCard 
                        title="Share Refrescos Promedio" 
                        value={`${(kpis.avgShare * 100).toFixed(1)}%`} 
                        icon={<PieChart className="h-5 w-5 text-purple-600" />}
                        trend={null}
                    />
                </div>

                {/* Charts & Lists Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Clients Treemap */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700">Top 10 Clientes (Volumen UC)</h3>
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
                                    <RechartsTooltip 
                                        formatter={(value: any) => [Number(value).toLocaleString(), 'UC Volumen']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Winners & Losers Panel (Replaces Product Mix) */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-slate-700">Ranking Oro / Diamante</h3>
                            <p className="text-[10px] text-slate-400">Filtrado por GEC: "ORO" o "DIAMANTE"</p>
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
                                        processedData.winners.map((client, idx) => (
                                            <div key={client.id} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="flex-shrink-0 w-5 h-5 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-slate-700 truncate" title={client.RazonSocial}>
                                                            {client.RazonSocial.length > 15 ? client.RazonSocial.substring(0, 15) + '...' : client.RazonSocial}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{Number(client.UC12mm).toLocaleString()} UC</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md ml-2">
                                                    +{(client.Var2025vs2024 * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-4 text-center">
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
                                        processedData.losers.map((client, idx) => (
                                            <div key={client.id} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="flex-shrink-0 w-5 h-5 bg-red-50 text-red-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-slate-700 truncate" title={client.RazonSocial}>
                                                            {client.RazonSocial.length > 15 ? client.RazonSocial.substring(0, 15) + '...' : client.RazonSocial}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{Number(client.UC12mm).toLocaleString()} UC</div>
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded-md ml-2 ${client.Var2025vs2024 < 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                                                    {(client.Var2025vs2024 * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-4 text-center">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">Listado de Clientes</h3>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium">
                            {filteredData.length}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {