import React, { useMemo, useState } from 'react';
import { SalesRecord, FilterState } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { COLORS } from '../constants';
import { ChatAssistant } from './ChatAssistant';

interface DashboardProps {
    data: SalesRecord[];
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onLogout }) => {
    const [filters, setFilters] = useState<FilterState>({
        GEC: 'all',
        GrupoCanal: 'all',
        RutaVenta: 'all',
        RutaDesarr: 'all'
    });

    // Unique values for dropdowns
    const options = useMemo(() => {
        return {
            GEC: Array.from(new Set(data.map(d => d.GEC))).sort(),
            GrupoCanal: Array.from(new Set(data.map(d => d.GrupoCanal))).sort(),
            RutaVenta: Array.from(new Set(data.map(d => d.RutaVenta))).sort(),
            RutaDesarr: Array.from(new Set(data.map(d => d.RutaDesarr))).sort(),
        };
    }, [data]);

    // Filtering logic
    const filteredData = useMemo(() => {
        return data.filter(item => {
            return (filters.GEC === 'all' || item.GEC === filters.GEC) &&
                   (filters.GrupoCanal === 'all' || item.GrupoCanal === filters.GrupoCanal) &&
                   (filters.RutaVenta === 'all' || item.RutaVenta === filters.RutaVenta) &&
                   (filters.RutaDesarr === 'all' || item.RutaDesarr === filters.RutaDesarr);
        });
    }, [data, filters]);

    // KPI Calculations
    const kpis = useMemo(() => {
        const totalVol = filteredData.reduce((acc, curr) => acc + curr.UC12mm, 0);
        // Weighted average for growth based on volume
        const totalGrowth = filteredData.reduce((acc, curr) => acc + (curr.Var2025vs2024 * curr.UC12mm), 0) / (totalVol || 1);
        const avgShare = filteredData.reduce((acc, curr) => acc + curr.ShareREFRESCOS, 0) / (filteredData.length || 1);
        
        return { totalVol, totalGrowth, avgShare };
    }, [filteredData]);

    // Chart Data Preparation
    const chartsData = useMemo(() => {
        // Group by Route
        const byRoute: Record<string, number> = {};
        filteredData.forEach(d => {
            byRoute[d.RutaVenta] = (byRoute[d.RutaVenta] || 0) + d.UC12mm;
        });
        const barData = Object.keys(byRoute).map(k => ({ name: k, value: byRoute[k] })).sort((a,b) => b.value - a.value).slice(0, 10);

        // Group by GEC
        const byGEC: Record<string, number> = {};
        filteredData.forEach(d => {
            byGEC[d.GEC] = (byGEC[d.GEC] || 0) + d.UC12mm;
        });
        const pieData = Object.keys(byGEC).map(k => ({ name: k, value: byGEC[k] }));

        return { barData, pieData };
    }, [filteredData]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">SalesComander Pro</h1>
                    <p className="text-xs text-slate-500">Dashboard de Ventas</p>
                </div>
                <button onClick={onLogout} className="text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 px-3 py-1.5 rounded-full">
                    Salir
                </button>
            </header>

            {/* Filters */}
            <section className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
                    <Filter className="h-4 w-4" /> Filtros Activos
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(options) as Array<keyof FilterState>).map((key) => (
                        <select
                            key={key}
                            value={filters[key]}
                            onChange={(e) => handleFilterChange(key, e.target.value)}
                            className="block w-full text-sm border-slate-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-slate-50 py-2 px-3"
                        >
                            <option value="all">Todas: {key}</option>
                            {options[key].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
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
                        title="Crecimiento '25 vs '24" 
                        value={`${(kpis.totalGrowth * 100).toFixed(1)}%`} 
                        icon={kpis.totalGrowth >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                        trend={kpis.totalGrowth}
                        isPercent
                    />
                    <KpiCard 
                        title="Share Refrescos" 
                        value={`${(kpis.avgShare * 100).toFixed(1)}%`} 
                        icon={<DollarSign className="h-5 w-5 text-purple-600" />}
                        trend={null}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-4">Ventas por Ruta (Top 10)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-4">Mix por GEC</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartsData.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartsData.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Client List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Listado de Clientes ({filteredData.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {filteredData.slice(0, 50).map((client) => (
                            <ClientRow key={client.id} client={client} />
                        ))}
                        {filteredData.length > 50 && (
                            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50">
                                Mostrando primeros 50 de {filteredData.length} registros. Use filtros para refinar.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ChatAssistant data={filteredData} />
        </div>
    );
};

const KpiCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend: number | null, isPercent?: boolean }> = ({ title, value, icon, trend, isPercent }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
        <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
            {trend !== null && (
                <div className={`text-xs mt-2 font-medium flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '+' : ''}{isPercent ? (trend * 100).toFixed(1) + '%' : trend} vs Año Anterior
                </div>
            )}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            {icon}
        </div>
    </div>
);

const ClientRow: React.FC<{ client: SalesRecord }> = ({ client }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div>
                    <div className="font-semibold text-slate-800">{client.RazonSocial}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Vol: {client.UC12mm.toLocaleString()} UC</div>
                </div>
                <div className={`p-1 rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                </div>
            </button>
            {isOpen && (
                <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100 text-sm">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-3">
                        <div>
                            <span className="text-xs text-slate-500 block">Ruta Venta</span>
                            <span className="font-medium text-slate-700">{client.RutaVenta}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Desarrollador</span>
                            <span className="font-medium text-slate-700">{client.RutaDesarr}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Crecimiento</span>
                            <span className={`font-medium ${client.Var2025vs2024 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(client.Var2025vs2024 * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Ticket Promedio</span>
                            <span className="font-medium text-slate-700">S/ {client.TP.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-slate-500 block">Share Refrescos</span>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min(client.ShareREFRESCOS * 100, 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700 mt-1 block text-right">
                                {(client.ShareREFRESCOS * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};