import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Globe, ShieldAlert, BarChart3, Users, HelpCircle } from 'lucide-react';
import { parseExcelFile, saveToStorage } from '../services/dataService';
import { SalesRecord } from '../types';
import { formatNumber } from '../constants';

interface AdminPanelProps {
    onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState<{ count: number; totalVol: number } | null>(null);
    const [debugHeaders, setDebugHeaders] = useState<string[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');
        setStats(null);
        setDebugHeaders([]);

        try {
            const { data, debugHeaders: headers } = await parseExcelFile(file);
            setDebugHeaders(headers);
            
            // Calculate stats for feedback
            const count = data.length;
            const totalVol = data.reduce((acc, item) => acc + (item.UC12mm || 0), 0);
            
            setStats({ count, totalVol });

            if (count === 0) {
                throw new Error("El archivo no contiene registros válidos.");
            }

            await saveToStorage(data);
            setStatus('success');
            setMessage(`Base de datos actualizada correctamente.`);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Error al procesar el archivo.');
            console.error(error);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-blue-600 text-xs uppercase tracking-wider px-2 py-1 rounded">Admin</span>
                    Centro de Control
                </h1>
                <button 
                    onClick={onLogout}
                    className="text-sm text-slate-300 hover:text-white font-medium transition-colors"
                >
                    Cerrar Sesión
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                    <div className="mb-6 flex justify-center relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 scale-150"></div>
                        <div className="p-5 bg-blue-50 rounded-full relative z-10 shadow-sm">
                            <Globe className="h-12 w-12 text-blue-600" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Actualizar Base de Datos Global</h2>
                    <p className="text-slate-500 mb-6 px-4">
                        Suba el archivo Excel mensual. La información se sincronizará automáticamente en los dispositivos de todos los vendedores.
                    </p>

                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-8 text-left flex gap-3">
                        <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-800 leading-relaxed">
                            <strong>Atención:</strong> Esta acción sobrescribe la base de datos actual en la nube. Asegúrese de que el formato de columnas sea el correcto (RazonCliente, UC 12mm, etc.).
                        </p>
                    </div>

                    <div className="relative group mb-6">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-xl p-10 transition-all duration-200 ${loading ? 'bg-slate-50 border-slate-300' : 'border-blue-200 group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:shadow-inner'}`}>
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-3" />
                                    <span className="text-sm font-semibold text-slate-700">Procesando y Subiendo...</span>
                                    <span className="text-xs text-slate-400 mt-1">Por favor espere</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-3 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-sm font-bold text-slate-700">
                                        Seleccionar Archivo Excel
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">Soporta .xlsx y .xls</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {status === 'success' && stats && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-left">
                                <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-green-800">Carga Exitosa</h3>
                                    <p className="text-xs text-green-700">{message}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase">Clientes</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-800">{stats.count}</p>
                                </div>
                                <div className={`p-3 rounded-lg border ${stats.totalVol === 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${stats.totalVol === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase">Volumen Total</span>
                                    </div>
                                    <p className={`text-xl font-bold ${stats.totalVol === 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                        {formatNumber(stats.totalVol, 0)}
                                    </p>
                                </div>
                            </div>

                            {stats.totalVol === 0 && (
                                <div className="mt-4 text-left">
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-700">
                                            <strong>Error de Volumen:</strong> No se pudo leer la columna "UC 12mm".
                                        </p>
                                    </div>
                                    <div className="bg-slate-100 rounded-lg p-3 text-[10px] text-slate-600 font-mono overflow-auto max-h-32 border border-slate-200">
                                        <p className="font-bold mb-1">Columnas detectadas en su archivo:</p>
                                        <p>{debugHeaders.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-red-800">Error de Carga</h3>
                                <p className="text-sm text-red-700 mt-1">{message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};