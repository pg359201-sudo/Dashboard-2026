import React, { useState, ErrorInfo, ReactNode, Component } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { loadFromStorage } from './services/dataService';
import { SalesRecord, UserSession } from './types';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
                        <p className="text-slate-500 text-sm mb-6">
                            La aplicación encontró un error inesperado.
                        </p>
                        <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-left overflow-auto max-h-32 mb-6 text-slate-700">
                            {this.state.error?.message || "Error desconocido"}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" /> Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const AppContent: React.FC = () => {
    const [session, setSession] = useState<UserSession>({ role: null, isAuthenticated: false });
    const [data, setData] = useState<SalesRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load logic
    const handleLogin = async (role: 'admin' | 'viewer') => {
        setIsLoading(true);
        try {
            if (role === 'viewer') {
                // Viewers fetch data immediately upon login
                const loadedData = await loadFromStorage();
                // Ensure loadedData is an array to prevent crashes
                setData(Array.isArray(loadedData) ? loadedData : []);
            }
            setSession({ role, isAuthenticated: true });
        } catch (error) {
            console.error("Login process error:", error);
            alert("Error al iniciar sesión. Verifica la consola.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setSession({ role: null, isAuthenticated: false });
        setData([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Iniciando SalesComander...</p>
            </div>
        );
    }

    if (!session.isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="antialiased text-slate-900">
            {session.role === 'admin' ? (
                <AdminPanel onLogout={handleLogout} />
            ) : (
                <Dashboard data={data} onLogout={handleLogout} />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;