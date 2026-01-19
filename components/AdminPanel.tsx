import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
            setMessage(`Archivo procesado exitosamente. ${data.length} registros cargados.`);
        } catch (error) {
            setStatus('error');
            setMessage('Error al procesar el archivo. Asegúrese de que sea un Excel válido.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">ADMIN</span>
                    Panel de Carga
                </h1>
                <button 
                    onClick={onLogout}
                    className="text-sm text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                    Cerrar Sesión
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-blue-50 rounded-full">
                            <Upload className="h-12 w-12 text-blue-600" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Cargar Datos Mensuales</h2>
                    <p className="text-slate-500 mb-8">
                        Suba el archivo Excel (.xlsx) con las ventas actualizadas. 
                        Esto sobrescribirá los datos actuales en el Dashboard.
                    </p>

                    <div className="relative group">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`border-2 border-dashed rounded-xl p-8 transition-colors ${loading ? 'bg-slate-50 border-slate-300' : 'border-blue-200 group-hover:border-blue-500 group-hover:bg-blue-50'}`}>
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                                    <span className="text-sm text-slate-600">Procesando archivo...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className="h-8 w-8 text-slate-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700">
                                        Click para seleccionar o arrastre aquí
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">Soporta archivos .xlsx</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-green-800">Carga Exitosa</h3>
                                <p className="text-sm text-green-700">{message}</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-red-800">Error de Carga</h3>
                                <p className="text-sm text-red-700">{message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
