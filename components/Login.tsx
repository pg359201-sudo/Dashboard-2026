import React, { useState } from 'react';
import { ADMIN_PASSWORD, VIEWER_PASSWORD } from '../constants';
import { Lock, Loader2, Fingerprint } from 'lucide-react';

interface LoginProps {
    onLogin: (role: 'admin' | 'viewer') => void;
}

// --- COMPONENTS ---

// 1. Page Background (Blanco Puro Limpio)
const PageBackground = () => (
    <div className="absolute inset-0 z-0 bg-white">
        {/* Fondo blanco puro, sin trazos de circuito */}
    </div>
);

// 2. Header Tech Pattern (Trazos tecnológicos SOLO en el encabezado oscuro - Versión Limpia sin Platillo)
const HeaderTechPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="line-fade" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Circuit Lines - Trazos Complejos y Tecnológicos */}
            <g stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.15">
                
                {/* --- SATELLITE ALLUSION (Top Left) --- */}
                {/* Orbital Node with Panels - Reubicado para dar aire (Moved from 60,35 to 85,25) */}
                {/* ANIMATION ADDED: Nested group to handle rotation animation while keeping position */}
                <g transform="translate(85, 25)">
                    {/* NUEVO: Movimiento de traslación Izquierda-Derecha (Orbiting) - RALENTIZADO AUN MAS (27s) */}
                    {/* ACTUALIZADO: Rango ampliado de 70 a 100 para más recorrido */}
                    <animateTransform 
                        attributeName="transform" 
                        type="translate" 
                        values="70 25; 100 25; 70 25" 
                        dur="27s" 
                        repeatCount="indefinite" 
                    />

                    {/* NEW: Vertical Floating (Subtle Bobbing) */}
                    <g>
                        <animateTransform 
                            attributeName="transform" 
                            type="translate" 
                            values="0 -2; 0 2; 0 -2" 
                            dur="6s" 
                            repeatCount="indefinite" 
                        />

                        <g>
                            {/* Movimiento MÁS PRONUNCIADO: Rotación de -30 a 10 grados y vuelta (40 grados de barrido) */}
                            <animateTransform 
                                attributeName="transform" 
                                type="rotate" 
                                values="-30 0 0; 10 0 0; -30 0 0" 
                                dur="5s" 
                                repeatCount="indefinite" 
                            />
                            
                            {/* Visual Elements Scaled Down (0.85) */}
                            <g transform="scale(0.85)">
                                {/* Solar Panels (Rectangles) */}
                                <rect x="-12" y="-3" width="8" height="6" fill="white" fillOpacity="0.1" strokeWidth="0.5" />
                                <rect x="4" y="-3" width="8" height="6" fill="white" fillOpacity="0.1" strokeWidth="0.5" />
                                {/* Body */}
                                <circle cx="0" cy="0" r="3" fill="white" fillOpacity="0.2" />
                                {/* Connection lines to grid - Modified (y2=16) and Opacity 0.13 */}
                                <line x1="0" y1="3" x2="0" y2="16" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.13" />
                                {/* Radio Waves (Communication) - Adjusted to 0.11 opacity as requested */}
                                <path d="M -4 -6 Q 0 -10 4 -6" strokeWidth="1" strokeOpacity="0.11" />
                                <path d="M -7 -9 Q 0 -15 7 -9" strokeWidth="1" strokeOpacity="0.11" />
                            </g>
                        </g>
                    </g>
                </g>

                {/* --- Left Side Complex --- */}
                {/* Bus Lines (Parallel Traces) */}
                <path d="M -20 40 H 30 L 50 60 V 140 L 30 160" />
                <path d="M -20 46 H 26 L 44 64 V 136" strokeOpacity="0.1" /> 
                <circle cx="50" cy="60" r="2" fill="white" stroke="none" opacity="0.3" />
                
                {/* Branch Trace Left */}
                <path d="M 0 90 H 20 L 30 100 V 120" />
                <circle cx="30" cy="100" r="1.5" fill="white" stroke="none" opacity="0.2" />
                
                {/* Chip/Node Decoration Left */}
                <rect x="18" y="88" width="4" height="4" fill="white" fillOpacity="0.1" stroke="none" />
                <path d="M 22 90 H 28" strokeWidth="0.5" strokeOpacity="0.2" />

                {/* Data bits Left */}
                <circle cx="44" cy="80" r="1" fill="white" stroke="none" opacity="0.2" />
                <circle cx="44" cy="90" r="1" fill="white" stroke="none" opacity="0.2" />

                {/* --- Right Side Complex --- */}
                {/* Bus Lines (Parallel Traces) */}
                <path d="M 100% 30 H calc(100% - 40px) L calc(100% - 70px) 60 V 150" />
                <path d="M 100% 36 H calc(100% - 36px) L calc(100% - 64px) 64 V 140" strokeOpacity="0.1" />
                <circle cx="calc(100% - 70px)" cy="60" r="2" fill="white" stroke="none" opacity="0.3" />
                
                {/* Secondary Trace Right */}
                <path d="M 100% 110 H calc(100% - 30px) L calc(100% - 50px) 130" />
                <circle cx="calc(100% - 50px)" cy="130" r="1.5" fill="white" stroke="none" opacity="0.2" />
                
                {/* Chip decoration Right */}
                <path d="M calc(100% - 80px) 40 H calc(100% - 90px) V 50" strokeOpacity="0.1" />
                <rect x="calc(100% - 85px)" y="35" width="4" height="4" fill="white" fillOpacity="0.1" stroke="none" />

                {/* --- Center / Bottom Accents --- */}
                {/* Bottom Up Trace (Center Left) */}
                <path d="M 100 100% V calc(100% - 20px) L 120 calc(100% - 40px) H 140" strokeOpacity="0.1" />
                <circle cx="140" cy="calc(100% - 40px)" r="1.5" fill="white" stroke="none" opacity="0.2" />
                
                {/* Bottom Up Trace (Center Right) */}
                <path d="M calc(100% - 100px) 100% V calc(100% - 25px) L calc(100% - 120px) calc(100% - 45px)" strokeOpacity="0.1" />
                <rect x="calc(100% - 122px)" y="calc(100% - 47px)" width="3" height="3" fill="white" fillOpacity="0.1" stroke="none" />

                {/* Top Corner Accents */}
                <path d="M 10 0 V 15 L 25 30 H 50" strokeOpacity="0.1" />
                <path d="M calc(100% - 10px) 0 V 15 L calc(100% - 25px) 30 H calc(100% - 50px)" strokeOpacity="0.1" />

                {/* Floating Logic Nodes (dots) */}
                <circle cx="20%" cy="20%" r="1" fill="white" opacity="0.1" />
                
                {/* Right Top Node - Animated (Extended Range, Low Brightness, 16s) */}
                <circle cx="80%" cy="25%" r="1.5" fill="white" opacity="0.1">
                    <animate attributeName="opacity" values="0.1; 0.4; 0.1" dur="16s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="80%; 90%; 80%" dur="16s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="25%; 15%; 25%" dur="16s" repeatCount="indefinite" />
                </circle>

                <circle cx="15%" cy="80%" r="1" fill="white" opacity="0.1" />

                {/* Right Bottom Node - Animated (Extended Range, Low Brightness, 16s) */}
                <circle cx="85%" cy="75%" r="1.5" fill="white" opacity="0.1">
                    <animate attributeName="opacity" values="0.1; 0.4; 0.1" dur="16s" repeatCount="indefinite" begin="8s"/>
                    <animate attributeName="cx" values="85%; 95%; 85%" dur="16s" repeatCount="indefinite" begin="8s"/>
                    <animate attributeName="cy" values="75%; 85%; 75%" dur="16s" repeatCount="indefinite" begin="8s"/>
                </circle>

                {/* --- CENTRAL ACTIVE NODES (NUEVO) --- */}
                {/* Central-Left Pulse */}
                <circle cx="38%" cy="50%" r="1.2" fill="white" opacity="0.1">
                    <animate attributeName="opacity" values="0.1; 0.5; 0.1" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Central-Right Blink */}
                <circle cx="62%" cy="45%" r="1.2" fill="white" opacity="0.1">
                    <animate attributeName="opacity" values="0.1; 0.6; 0.1" dur="4.5s" repeatCount="indefinite" begin="1s" />
                </circle>

                {/* Center-Top Subtle */}
                <circle cx="50%" cy="25%" r="0.8" fill="white" opacity="0.1">
                    <animate attributeName="opacity" values="0; 0.4; 0" dur="2s" repeatCount="indefinite" begin="0.5s" />
                </circle>

                {/* Linea decorativa inferior */}
                <path d="M 0 100% L 100% 100%" stroke="url(#line-fade)" strokeWidth="0.5" />
            </g>
        </svg>
    </div>
);

// 3. Logo: Escudo Táctico estilo USA con Espada y Ojo de la Providencia (AI)
const ShieldLogo = () => (
    <svg viewBox="0 0 300 300" className="h-48 w-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500">
        <defs>
            {/* --- USA COLORS REFERENCE STYLE --- */}
            
            {/* Blue - Lighter (Less Dark) as requested */}
            {/* Moved from Blue-900/Slate-900 to Blue-700/Blue-950 */}
            <linearGradient id="usBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" /> {/* Blue 700 (More vibrant) */}
                <stop offset="100%" stopColor="#172554" /> {/* Blue 950 (Deep but not black) */}
            </linearGradient>

            {/* Red - Standard Flag Red with slight shading (Not Metallic) */}
            <linearGradient id="usRed" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#ef4444" /> {/* Red 500 */}
                 <stop offset="100%" stopColor="#991b1b" /> {/* Red 800 (Shadow) */}
            </linearGradient>

            {/* Silver/White Stripes - Subtle gradient */}
            <linearGradient id="usWhite" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Border - METALLIC BUT LESS REFLECTIVE (Toned down) */}
            {/* Removed pure white stops to reduce glare */}
            <linearGradient id="chromeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" /> {/* Slate 200 */}
                <stop offset="25%" stopColor="#94a3b8" /> {/* Slate 400 */}
                <stop offset="50%" stopColor="#f1f5f9" /> {/* Slate 100 (Soft Highlight) */}
                <stop offset="75%" stopColor="#64748b" /> {/* Slate 500 */}
                <stop offset="100%" stopColor="#334155" /> {/* Slate 700 (Dark Metal) */}
            </linearGradient>

            {/* SWORD GRADIENTS - INCREASED CONTRAST */}
            {/* Darker edges to stand out against white background */}
            <linearGradient id="swordBlade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" /> {/* Slate 700 (Gunmetal Edge) */}
                <stop offset="50%" stopColor="#f8fafc" /> {/* Very bright center ridge */}
                <stop offset="50%" stopColor="#cbd5e1" /> {/* Ridge Shadow */}
                <stop offset="100%" stopColor="#1e293b" /> {/* Slate 800 (Darker Edge) */}
            </linearGradient>

            {/* Hilt - Bronze/Orange Gold */}
            <linearGradient id="goldHilt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" /> {/* Amber 400 */}
                <stop offset="50%" stopColor="#d97706" /> {/* Amber 600 */}
                <stop offset="100%" stopColor="#78350f" /> {/* Amber 900 */}
            </linearGradient>
            
            {/* AI EYE GRADIENT - Bright Cyan/Blue Gem */}
            <radialGradient id="aiEyeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#e0f2fe" /> {/* White/Cyan Center */}
                <stop offset="40%" stopColor="#06b6d4" /> {/* Cyan 500 */}
                <stop offset="100%" stopColor="#0891b2" /> {/* Cyan 600 */}
            </radialGradient>

            {/* Glass Shine Overlay */}
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
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

            {/* Tiny Star Definition */}
            <path id="tinyStar" d="M0 -2.2 L0.7 -0.7 L2.2 -0.7 L1.1 0.3 L1.5 1.8 L0 1.1 L-1.5 1.8 L-1.1 0.3 L-2.2 -0.7 L-0.7 -0.7 Z" />
        </defs>

        <g transform="translate(50, 20)" filter="url(#dropShadow)">
            
            {/* 1. BASE CHROME FRAME */}
            <path d="M10 20 L190 20 L190 70 Q190 180 100 240 Q10 180 10 70 Z" 
                  fill="url(#chromeBorder)" stroke="#334155" strokeWidth="1" />

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
                    <rect x="0" y="0" width="200" height="85" fill="url(#usBlue)" stroke="#334155" strokeWidth="1" />
                    
                    {/* Stars on the Chief - US Flag Style Grid */}
                    <g fill="white" opacity="0.25">
                         {Array.from({ length: 5 }).map((_, r) => (
                             Array.from({ length: r % 2 !== 0 ? 9 : 10 }).map((_, c) => (
                                 <use 
                                    key={`s-${r}-${c}`} 
                                    href="#tinyStar" 
                                    x={15 + c * 19 + (r % 2 !== 0 ? 9.5 : 0)} 
                                    y={15 + r * 14} 
                                />
                             ))
                         ))}
                    </g>
                 </g>
                 
                 {/* Inner Stroke definition to clean up edges */}
                 <use href="#innerShieldPath" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
            </g>

            {/* 3. CENTRAL SWORD (Replaces Diamond) */}
            <g transform="translate(0, 5)" filter="url(#dropShadow)">
                 {/* Blade - Wider and more defined. INCREASED CONTRAST STROKE */}
                 <path d="M90 85 L110 85 L100 218 Z" fill="url(#swordBlade)" stroke="#334155" strokeWidth="1" />
                 {/* Central Ridge of Blade */}
                 <path d="M100 85 L100 218" stroke="#ffffff" strokeWidth="0.75" opacity="0.9" />

                 {/* Hilt / Crossguard */}
                 <path d="M75 85 L125 85 L125 92 L108 98 L100 102 L92 98 L75 92 Z" 
                       fill="url(#goldHilt)" stroke="#451a03" strokeWidth="1" />
                 
                 {/* Grip */}
                 <rect x="94" y="55" width="12" height="32" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="0.5" />
                 {/* Grip Texture */}
                 <path d="M94 62 L106 62 M94 68 L106 68 M94 74 L106 74 M94 80 L106 80" stroke="#d97706" strokeWidth="1" opacity="0.8" />

                 {/* POMMEL REPLACED BY "THE ALL-SEEING EYE" (Enhanced) */}
                 <g transform="translate(100, 52) scale(1.25)"> {/* Scaled up for Emphasis */}
                     {/* 1. Connection to grip (Neck) */}
                     <rect x="-2.5" y="2" width="5" height="5" fill="url(#goldHilt)" />

                     {/* 2. The Eye Setting (Gold) - More pronounced with Breathing Outline */}
                     {/* UPDATE: Reduced Intensity slightly as requested (Less impactful than previous step) */}
                     {/* UPDATE 2: Intermediate color between Amber 600 and 700 (#c26607) */}
                     <path d="M -15 0 Q 0 -11 15 0 Q 0 11 -15 0 Z" 
                           fill="url(#goldHilt)" stroke="#451a03" strokeWidth="0.8">
                           {/* Animation: Outline Glows synchronously with pupil - MODERATE */}
                           <animate attributeName="stroke" values="#451a03; #c26607; #451a03" dur="2s" repeatCount="indefinite" />
                           <animate attributeName="stroke-width" values="0.8; 1.8; 0.8" dur="2s" repeatCount="indefinite" />
                     </path>
                     
                     {/* 3. The Sclera (Dark Tech Background) */}
                     <path d="M -11 0 Q 0 -7 11 0 Q 0 7 -11 0 Z" 
                           fill="#020617" stroke="#1e293b" strokeWidth="0.5" /> 

                     {/* 4. Iris Lines (Tech Rays) */}
                     <g opacity="0.5">
                        <line x1="0" y1="-5" x2="0" y2="-2.5" stroke="#22d3ee" strokeWidth="0.5" />
                        <line x1="0" y1="5" x2="0" y2="2.5" stroke="#22d3ee" strokeWidth="0.5" />
                        <line x1="-5" y1="0" x2="-2.5" y2="0" stroke="#22d3ee" strokeWidth="0.5" />
                        <line x1="5" y1="0" x2="2.5" y2="0" stroke="#22d3ee" strokeWidth="0.5" />
                     </g>

                     {/* 5. The Pupil (AI Core) - Pulsing Animation */}
                     <circle cx="0" cy="0" r="3" fill="url(#aiEyeGlow)">
                         {/* Animación: Thinking Effect (Impactful: 0.4 to 1 opacity, 2.5 to 6 size) */}
                         <animate attributeName="opacity" values="0.4; 1; 0.4" dur="2s" repeatCount="indefinite" />
                         <animate attributeName="r" values="2.5; 6; 2.5" dur="2s" repeatCount="indefinite" />
                     </circle>
                     
                     {/* 6. Center Glint (Pure White) */}
                     <circle cx="0" cy="0" r="1" fill="#ffffff" />

                     {/* 7. Reflection */}
                     <circle cx="-3" cy="-2" r="1.5" fill="white" opacity="0.7" />
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Layer: White Pure Background */}
            <PageBackground />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 relative z-10">
                {/* Header: Degradado oscuro con trazos tecnológicos internos - Menos intensidad (Slate 600-800) */}
                <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-8 text-center relative overflow-hidden">
                    {/* NEW: Tech Pattern only inside header */}
                    <HeaderTechPattern />
                    
                    {/* SVG Logo Component */}
                    <div className="flex justify-center mb-4 relative z-10 -mt-2">
                        <ShieldLogo />
                    </div>

                    <h1 className="text-xl font-tech font-bold text-white relative z-10 tracking-wider uppercase -mt-2 whitespace-nowrap">SalesComander Pro</h1>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center transform active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Fingerprint className="h-5 w-5" />
                                <span className="font-tech tracking-wider uppercase text-xs">Acceso Seguro</span>
                            </div>
                        )}
                    </button>
                    
                    <div className="mt-6 text-center text-[10px] text-slate-400 space-y-3">
                        <p>Built by PascaTech</p>
                    </div>
                </form>
            </div>
        </div>
    );
};