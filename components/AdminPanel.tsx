import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Globe, ShieldAlert } from 'lucide-react';
import { parseExcelFile, saveToStorage } from '../services/dataService';

interface AdminPanelProps {
    onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const data = await parseExcelFile(file);
            await saveToStorage(data);
            setStatus('success');
            setMessage(`Base de datos Global actualizada. ${data.length} registros sincronizados en la nube.`);
        } catch (error) {
            setStatus('error');
            setMessage('Error al sincronizar con la nube. Verifique su conexión o el formato del archivo.');
            console.error(error);
        } finally {
            setLoading(false);
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
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                    <div className="mb-6 flex justify-center relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 scale-150"></div>
                        <div className="p-5 bg-blue-50 rounded-full relative z-10 shadow-sm">
                            <Globe className="h-12 w-12 text-blue-600" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Actualizar Base de Datos Global</h2>
                    <p className="text-slate-500 mb-6 px-4">
                        Suba el archivo Excel mensual. La información se sincronizará automáticamente en los dispositivos de 
                        <span className="font-bold text-slate-700"> todos los vendedores</span>.
                    </p>

                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-8 text-left flex gap-3">
                        <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-800 leading-relaxed">
                            <strong>Atención:</strong> Esta acción sobrescribe la base de datos actual en la nube de forma irreversible. Asegúrese de que el archivo Excel es el correcto antes de continuar.
                        </p>
                    </div>

                    <div className="relative group">
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
                                    <span className="text-sm font-semibold text-slate-700">Subiendo a la nube...</span>
                                    <span className="text-xs text-slate-400 mt-1">No cierre esta ventana</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-3 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-sm font-bold text-slate-700">
                                        Seleccionar Archivo Excel
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">Arrastre o haga clic para buscar</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-green-800">Sincronización Exitosa</h3>
                                <p className="text-sm text-green-700 mt-1">{message}</p>
                            </div>
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