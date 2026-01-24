import React, { useMemo, useState } from 'react';
import { SalesRecord, FilterState } from '../types';
import { 
    Treemap, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { ChevronDown, Filter, TrendingUp, TrendingDown, Package, FileWarning, RefreshCw, AlertCircle, Award, PieChart, CheckCircle } from 'lucide-react';
import { COLORS, formatNumber } from '../constants';
import { ChatAssistant } from './ChatAssistant';
import { loadFromStorage } from '../services/dataService';

interface DashboardProps {
    data: SalesRecord[];
    onLogout: () => void;
}

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

// --- NUEVO: Tooltip Personalizado para mostrar Nombre y Volumen ---
const CustomTreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        // payload[0].payload contiene los datos originales del nodo del treemap
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg min-w-[160px] z-50">
                {/* Nombre del Cliente: Texto pequeño pero negrita (text-xs font-bold) */}
                <p className="text-xs font-bold text-gray-900 mb-1.5 leading-tight border-b border-gray-100 pb-1">
                    {data.name}
                </p>
                {/* Volumen */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Volumen</span>
                    <span className="text-sm font-bold text-blue-600">
                        {formatNumber(data.value, 0)} <span className="text-[10px]">UC</span>
                    </span>
                </div>
            </div>
        );
    }
    return null;
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
                    <h1 className="text-lg font-tech font-bold text-gray-900 leading-tight tracking-wider uppercase">
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
                            <ClientRow key={client.id} client={client} />
                        ))}
                    </div>
                </div>
            </main>

            <ChatAssistant data={filteredData} />
        </div>
    );
};

// Compact KpiCard
const KpiCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend: number | null, isPercent?: boolean }> = ({ title, value, icon, trend, isPercent }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">{value}</h4>
            {trend !== null && (
                <div className={`text-[10px] mt-1.5 font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full inline-flex' : 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full inline-flex'}`}>
                    {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    <span>{trend >= 0 ? '+' : ''}{formatNumber(trend * 100, 1)}% vs AA</span>
                </div>
            )}
        </div>
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
            {icon}
        </div>
    </div>
);

const ClientRow: React.FC<{ client: SalesRecord }> = ({ client }) => {
    const [isOpen, setIsOpen] = useState(false);

    const renderShareItem = (label: string, vol: number) => {
        const total = client.UC12mm || 0;
        const percent = total > 0 ? (vol / total) * 100 : 0;
        const displayValue = formatNumber(percent, 1) + '%';
        const isZero = percent < 0.05; 

        return (
            <div>
                <span className="text-[9px] uppercase tracking-wide text-gray-400 block">{label}</span>
                <span className={`text-xs font-semibold ${isZero ? 'text-red-500' : 'text-gray-700'}`}>
                    {displayValue}
                </span>
            </div>
        );
    };

    return (
        <div className="group transition-colors hover:bg-gray-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-5 py-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${client.Var2025vs2024 >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                        {client.RazonSocial.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-sm">{client.RazonSocial}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Vol: <strong>{formatNumber(client.UC12mm, 0)} UC</strong></div>
                    </div>
                </div>
                <div className={`p-1 rounded-full bg-gray-100 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </button>
            {isOpen && (
                <div className="px-5 pb-4 pl-16 text-sm">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-2 border-t border-gray-100">
                        <div>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">Ruta Venta</span>
                            <span className="font-medium text-gray-700">{client.RutaVenta}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">Var YTD</span>
                            <span className={`font-medium ${client.Var2025vs2024 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatNumber(client.Var2025vs2024 * 100, 1)}%
                            </span>
                        </div>
                        
                        <div>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">TP</span>
                            <span className="font-medium text-gray-700">{client.TP ? formatNumber(client.TP, 2) : '0,00'}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">TP %</span>
                            <span className="font-medium text-gray-700">
                                {client.TP_RED ? formatNumber(client.TP_RED * 100, 1) : '0,0'}%
                            </span>
                        </div>

                        <div className="col-span-2">
                            <span className="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">Share Refrescos</span>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(client.ShareREFRESCOS * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-gray-700 w-10 text-right">
                                    {formatNumber(client.ShareREFRESCOS * 100, 0)}%
                                </span>
                            </div>
                        </div>

                        <div className="col-span-2 pt-2 border-t border-gray-100 border-dashed mt-1">
                             <div className="grid grid-cols-3 gap-y-2 gap-x-1">
                                {renderShareItem('Aguas', client.VolAgua)}
                                {renderShareItem('Jugos', client.VolJugos)}
                                {renderShareItem('Energy', client.VolEnergizantes)}
                                {renderShareItem('Spirits', client.VolSpirits)}
                                {renderShareItem('Vinos', client.VolVinos)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};