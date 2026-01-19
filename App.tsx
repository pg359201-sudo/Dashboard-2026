import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { loadFromStorage } from './services/dataService';
import { SalesRecord, UserSession } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
    const [session, setSession] = useState<UserSession>({ role: null, isAuthenticated: false });
    const [data, setData] = useState<SalesRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load logic
    const handleLogin = async (role: 'admin' | 'viewer') => {
        setIsLoading(true);
        if (role === 'viewer') {
            try {
                // Viewers fetch data immediately upon login
                const loadedData = await loadFromStorage();
                setData(loadedData);
            } catch (error) {
                console.error("Failed to load data", error);
            }
        }
        setSession({ role, isAuthenticated: true });
        setIsLoading(false);
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

export default App;
