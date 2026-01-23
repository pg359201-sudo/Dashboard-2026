import React, { useState } from 'react';
import { ADMIN_PASSWORD, VIEWER_PASSWORD } from '../constants';
import { Lock, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (role: 'admin' | 'viewer') => void;
}

// Logo: Escudo Táctico estilo USA con Espada y Ojo de la Providencia (AI)
const ShieldLogo = () => (
    <svg viewBox="0 0 300 300" className="h-48 w-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500">
        <defs>
            {/* --- USA COLORS METALLIC --- */}
            {/* Old Glory Blue Metallic */}
            <linearGradient id="usBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3c3b6e" />
                <stop offset="50%" stopColor="#202050" />
                <stop offset="100%" stopColor="#0a0a20" />
            </linearGradient>

            {/* Old Glory Red Metallic */}
            <linearGradient id="usRed" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#b22234" />
                <stop offset="40%" stopColor="#801010" />
                <stop offset="60%" stopColor="#e03040" />
                <stop offset="100%" stopColor="#600000" />
            </linearGradient>

            {/* Silver/White Stripes */}
            <linearGradient id="usWhite" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="20%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="80%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Heavy Chrome Border */}
            <linearGradient id="chromeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="20%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="80%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* SWORD GRADIENTS */}
            <linearGradient id="swordBlade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#ffffff" /> {/* Ridge Highlight */}
                <stop offset="51%" stopColor="#cbd5e1" /> {/* Ridge Shadow */}
                <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="goldHilt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            
            {/* AI EYE GRADIENT */}
            <radialGradient id="aiEyeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
                <stop offset="100%" stopColor="#0891b2" /> {/* Cyan-600 */}
            </radialGradient>

            {/* Glass Shine */}
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
                <stop offset="40%" stopColor="white" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </linearGradient>

            {/* Inner Shadow for Depth */}
            <filter id="insetShadow">
                <feComponentTransfer in="SourceAlpha">
                    <feFuncA type="table" tableValues="1 0" />
                </feComponentTransfer>
                <feGaussianBlur stdDeviation="3"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feFlood floodColor="rgb(0, 0, 0)" floodOpacity="0.5"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feComposite in2="SourceAlpha" operator="in" />
                <feMerge>
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode />
                </feMerge>
            </filter>
            
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="8" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge> 
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/> 
                </feMerge>
            </filter>

            {/* Clip Path for the Shield Shape to cut stripes */}
            <path id="innerShieldPath" d="M25 35 L175 35 L175 75 Q175 165 100 220 Q25 165 25 75 Z" />
        </defs>

        <g transform="translate(50, 20)" filter="url(#dropShadow)">
            
            {/* 1. BASE CHROME FRAME */}
            <path d="M10 20 L190 20 L190 70 Q190 180 100 240 Q10 180 10 70 Z" 
                  fill="url(#chromeBorder)" stroke="#1e293b" strokeWidth="1" />

            {/* 2. INNER CONTENT CONTAINER (Masked) */}
            <g>
                 <clipPath id="shieldClip">
                    <use xlinkHref="#innerShieldPath" />
                 </clipPath>

                 <g clipPath="url(#shieldClip)">
                    {/* Background (White Stripes Base) */}
                    <rect x="0" y="0" width="200" height="250" fill="url(#usWhite)" />
                    
                    {/* Red Vertical Stripes (The "Pales") - Typical of US Shield Heraldry */}
                    <rect x="25" y="80" width="22" height="200" fill="url(#usRed)" />
                    <rect x="71" y="80" width="22" height="200" fill="url(#usRed)" />
                    <rect x="117" y="80" width="22" height="200" fill="url(#usRed)" />
                    <rect x="163" y="80" width="22" height="200" fill="url(#usRed)" />

                    {/* The Chief (Top Blue Section) */}
                    <rect x="0" y="0" width="200" height="85" fill="url(#usBlue)" stroke="#e2e8f0" strokeWidth="2" />
                    
                    {/* Stars on the Chief - Moved slightly to accommodate sword */}
                    <g fill="white" filter="url(#insetShadow)">
                        {/* Left Stars */}
                        <path transform="translate(45, 45) scale(0.6)" d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 9 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" />
                        <path transform="translate(30, 65) scale(0.4)" d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 9 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" />
                        
                        {/* Right Stars */}
                        <path transform="translate(155, 45) scale(0.6)" d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 9 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" />
                        <path transform="translate(170, 65) scale(0.4)" d="M0 -15 L4 -4 L15 -4 L6 4 L9 15 L0 9 L-9 15 L-6 4 L-15 -4 L-4 -4 Z" />
                    </g>
                 </g>
                 
                 {/* Inner Stroke definition to clean up edges */}
                 <use href="#innerShieldPath" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.5" />
            </g>

            {/* 3. CENTRAL SWORD (Replaces Diamond) */}
            <g transform="translate(0, 5)" filter="url(#dropShadow)">
                 {/* Blade */}
                 <path d="M92 85 L108 85 L100 215 Z" fill="url(#swordBlade)" stroke="#475569" strokeWidth="0.5" />
                 {/* Central Ridge of Blade */}
                 <path d="M100 85 L100 215" stroke="#ffffff" strokeWidth="0.5" opacity="0.7" />

                 {/* Hilt / Crossguard */}
                 <path d="M75 85 L125 85 L125 92 L108 98 L100 102 L92 98 L75 92 Z" 
                       fill="url(#goldHilt)" stroke="#451a03" strokeWidth="1" />
                 
                 {/* Grip */}
                 <rect x="94" y="55" width="12" height="32" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="0.5" />
                 {/* Grip Texture */}
                 <path d="M94 62 L106 62 M94 68 L106 68 M94 74 L106 74 M94 80 L106 80" stroke="#d97706" strokeWidth="1" opacity="0.8" />

                 {/* POMMEL REPLACED BY "THE ALL-SEEING EYE" (Sutil/Subtle) */}
                 <g transform="translate(100, 52)">
                     {/* 1. Connection to grip (Neck) */}
                     <rect x="-3" y="2" width="6" height="6" fill="url(#goldHilt)" />

                     {/* 2. The Eye Setting (Gold) */}
                     {/* Almond shape: Width 28, Height 16 approx */}
                     <path d="M -14 0 Q 0 -10 14 0 Q 0 10 -14 0 Z" 
                           fill="url(#goldHilt)" stroke="#451a03" strokeWidth="1" />
                     
                     {/* 3. The Sclera (Dark Tech Background) */}
                     <path d="M -10 0 Q 0 -6 10 0 Q 0 6 -10 0 Z" 
                           fill="#0f172a" /> 

                     {/* 4. The Pupil (AI Core) - Pulsing Animation */}
                     <circle cx="0" cy="0" r="3.5" fill="url(#aiEyeGlow)">
                         {/* Subtle pulse to indicate intelligence/activity */}
                         <animate attributeName="r" values="3.5;4.2;3.5" dur="3s" repeatCount="indefinite" />
                         <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
                     </circle>
                     
                     {/* 5. Iris Details (Tech Rings) */}
                     <circle cx="0" cy="0" r="5" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />

                     {/* 6. Reflection */}
                     <circle cx="-2" cy="-2" r="1.5" fill="white" opacity="0.8" />
                 </g>
            </g>

            {/* 4. GLASS / GLOSS OVERLAY */}
            {/* Top Shine */}
            <path d="M25 35 L175 35 L170 85 Q100 95 30 85 Z" fill="url(#glassShine)" opacity="0.5" style={{mixBlendMode: 'overlay'}} />
            {/* Side Curved Reflection */}
            <path d="M30 90 Q30 160 100 215 L90 218 Q25 160 25 90 Z" fill="white" opacity="0.1" />

        </g>
    </svg>
);

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
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                {/* Header: Cambiado de Blue-600 a un degradado de grises oscuros (Slate/Gunmetal) */}
                <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8 text-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent"></div>
                    
                    {/* SVG Logo Component */}
                    <div className="flex justify-center mb-4 relative z-10 -mt-2">
                        <ShieldLogo />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2 relative z-10 tracking-tight -mt-4">SalesComander Pro</h1>
                    {/* Texto secundario cambiado a un gris claro/plata */}
                    <p className="text-slate-300 text-sm relative z-10">Sistema de Gestión Táctica</p>
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
                                // Focus ring cambiado a Slate para mantener la estética gris
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all shadow-sm"
                                placeholder="Ingrese su contraseña..."
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center shadow-sm">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        // Botón cambiado a un gradiente de grises oscuros/negro táctico
                        className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center transform active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Ingresar al Sistema'}
                    </button>
                    
                    <div className="mt-6 text-center text-xs text-slate-400 space-y-3">
                        <p>v1.1.0 | Secured by Vercel</p>
                    </div>
                </form>
            </div>
        </div>
    );
};