import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD, VIEWER_PASSWORD, BLOB_TOKEN } from '../constants';
import { Fingerprint, Loader2, AlertTriangle } from 'lucide-react';

interface LoginProps {
    onLogin: (role: 'admin' | 'viewer') => void;
}

// URL del Logo: Apunta al archivo local ubicado en la carpeta 'public' del proyecto
const LOGO_URL = "/logo.png";

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Fondo de Circuitos (Estética Tech) */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M10 10 h80 v80 h-80 Z" fill="none" stroke="#2563eb" strokeWidth="0.5"/>
                        <path d="M50 10 v30 M10 50 h30 M90 50 h-30 M50 90 v-30" stroke="#2563eb" strokeWidth="0.5"/>
                        <circle cx="50" cy="50" r="3" fill="#2563eb"/>
                        <circle cx="10" cy="10" r="2" fill="#2563eb"/>
                        <circle cx="90" cy="90" r="2" fill="#2563eb"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#circuit)" />
                 </svg>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50"></div>
            </div>

            <div className="z-10 w-full max-w-sm px-6 flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-6 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-sky-300 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <img 
                        src={LOGO_URL} 
                        alt="Logo SalesComander" 
                        className="relative w-40 h-40 object-contain drop-shadow-2xl transform transition-transform duration-500 hover:scale-105"
                    />
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 tracking-tight text-center">
                    SalesComander Pro
                </h1>
                
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 items-center">
                    {/* Input Píldora */}
                    <div className="w-full relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-sky-300 rounded-full blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="relative w-full bg-white border-2 border-slate-200 text-slate-800 text-center font-bold text-lg tracking-widest py-4 px-6 rounded-full shadow-lg outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                            placeholder="INGRESE CLAVE DE ACCESO..."
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            {error}
                        </div>
                    )}

                    {/* Botón Acceso Seguro */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-6 w-6" />
                        ) : (
                            <>
                                <Fingerprint className="h-6 w-6 opacity-80" />
                                <span className="tracking-wide">ACCESO SEGURO</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                        Sistema de Gestión Comercial v1.2
                    </p>
                </div>
            </div>
        </div>
    );
};