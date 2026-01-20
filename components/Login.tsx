import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, VIEWER_PASSWORD, BLOB_TOKEN } from '../constants';
import { Lock, User, Loader2, Database, AlertTriangle } from 'lucide-react';

interface LoginProps {
    onLogin: (role: 'admin' | 'viewer') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dbStatus, setDbStatus] = useState<'connected' | 'local'>('local');

    useEffect(() => {
        if (BLOB_TOKEN) {
            setDbStatus('connected');
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate network delay for UX
        setTimeout(() => {
            if (password === ADMIN_PASSWORD) {
                onLogin('admin');
            } else if (password === VIEWER_PASSWORD) {
                onLogin('viewer');
            } else {
                setError('Contraseña incorrecta');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center relative">
                    <h1 className="text-3xl font-bold text-white mb-2">SalesComander Pro</h1>
                    <p className="text-blue-100">Sistema de Gestión Comercial</p>
                    
                    {/* Database Status Badge */}
                    <div className="absolute top-4 right-4">
                         {dbStatus === 'connected' ? (
                             <div className="flex items-center gap-1 bg-green-500/20 text-white text-[10px] px-2 py-1 rounded-full border border-green-400/30 backdrop-blur-sm">
                                 <Database className="h-3 w-3" />
                                 <span>Cloud DB On</span>
                             </div>
                         ) : (
                             <div className="flex items-center gap-1 bg-orange-500/20 text-white text-[10px] px-2 py-1 rounded-full border border-orange-400/30 backdrop-blur-sm">
                                 <AlertTriangle className="h-3 w-3" />
                                 <span>Modo Local</span>
                             </div>
                         )}
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Clave de Acceso
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ingrese su contraseña..."
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ingresar al Sistema'}
                    </button>
                    
                    <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
                        <p>v1.1.0 | Secured by Vercel</p>
                        {dbStatus === 'local' && (
                            <p className="text-orange-400">Nota: Configure BLOB_READ_WRITE_TOKEN para persistencia en nube.</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};