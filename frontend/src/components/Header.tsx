import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BiLeaf } from 'react-icons/bi';

export default function Header() {
    const location = useLocation();
    const [systemStatus, setSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('/api/v1/models/status');
                setSystemStatus(res.ok ? 'online' : 'offline');
            } catch {
                // Backend might not be proxied, try direct
                try {
                    const res = await fetch('http://localhost:8000/health');
                    setSystemStatus(res.ok ? 'online' : 'offline');
                } catch {
                    setSystemStatus('offline');
                }
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const statusColor = systemStatus === 'online' ? 'bg-emerald-500' : systemStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500';
    const statusText = systemStatus === 'online' ? 'Sistem Aktif' : systemStatus === 'offline' ? 'Çevrimdışı' : 'Kontrol...';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 header-glass">
            <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" className="no-underline flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 group-hover:shadow-emerald-600/40 transition-all duration-300">
                        <BiLeaf className="text-xl" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-emerald-700 transition-colors">AgroCortex</span>
                        <span className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">AI PLATFORM</span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-50/80 border border-slate-200/50 rounded-full backdrop-blur-sm">
                    <Link
                        to="/"
                        className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${location.pathname === '/'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        Analiz
                    </Link>
                    <Link
                        to="/greenhouse"
                        className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${location.pathname === '/greenhouse'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        Sera
                    </Link>
                </nav>

                {/* System Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/80 border border-slate-200/50 backdrop-blur-sm">
                    <span className={`w-2 h-2 rounded-full ${statusColor} ${systemStatus === 'online' ? 'animate-pulse' : ''}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{statusText}</span>
                </div>
            </div>
        </header>
    );
}
