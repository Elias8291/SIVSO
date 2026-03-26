import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, FileText, LogOut,
    Sun, Moon, ChevronRight,
    TrendingUp, Clock, CheckCircle, Users
} from 'lucide-react';
import SearchInput from './ui/SearchInput';

const DashboardSIVSO = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const auth = typeof window !== 'undefined' ? window.sivsoAuth : null;
    const [user, setUser] = useState(auth?.user || { name: 'Admin Oaxaca', email: 'admin@sivso.gob' });

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const handleLogout = () => {
        document.getElementById('logout-form')?.submit();
    };

    return (
        <div className="flex min-h-screen bg-[#FBFBFC] dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-['Plus_Jakarta_Sans'] transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-900 hidden lg:flex flex-col z-50">
                <div className="p-10">
                    <h1 className="text-2xl font-extrabold tracking-[0.2em] dark:text-white">
                        SIVSO<span className="text-brand-gold">.</span>
                    </h1>
                    <p className="text-[11px] text-zinc-400 uppercase tracking-[0.3em] mt-1 font-bold">Oaxaca Institucional</p>
                </div>

                <nav className="flex-1 px-6 space-y-2">
                    <NavItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <NavItem
                        icon={<Package size={18} />}
                        label="Inventario"
                        active={activeTab === 'inventario'}
                        onClick={() => setActiveTab('inventario')}
                    />
                    <NavItem
                        icon={<FileText size={18} />}
                        label="Solicitudes"
                        active={activeTab === 'solicitudes'}
                        onClick={() => setActiveTab('solicitudes')}
                    />
                </nav>

                <div className="p-8">
                    <form id="logout-form" method="POST" action={auth?.logoutUrl || '/logout'}>
                        <input type="hidden" name="_token" value={auth?.csrfToken || ''} />
                    </form>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[13px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all duration-200"
                    >
                        <LogOut size={14} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 flex flex-col">
                <header className="h-20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 sticky top-0 z-40 flex items-center justify-between px-10">
                    <div className="flex items-center gap-4">
                        <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest">Global / {activeTab}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 text-zinc-400 hover:text-brand-gold transition-colors bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-[13px] font-bold dark:text-white uppercase tracking-tighter group-hover:text-brand-gold transition-colors">{user.name}</p>
                                <p className="text-[9px] text-zinc-400 font-medium">{user.email}</p>
                            </div>
                            <div className="size-10 rounded-full border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 group-hover:border-brand-gold transition-all overflow-hidden">
                                <span className="text-xs font-bold text-brand-gold">AD</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-12">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Panel de Control</h2>
                            <p className="text-zinc-500 text-sm mt-2">Resumen operativo del Sistema de Vestuario y Calzado.</p>
                        </div>
                        <div className="flex gap-3 w-full max-w-xs sm:max-w-sm">
                            <SearchInput placeholder="Buscar folio…" />
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Stock Total" value="4,812" trend="+12%" icon={<TrendingUp size={16} />} isMain />
                        <StatCard label="Pendientes" value="24" color="text-orange-500" icon={<Clock size={16} />} />
                        <StatCard label="Completados" value="912" icon={<CheckCircle size={16} />} />
                        <StatCard label="Sindicatos" value="08" color="text-brand-gold" icon={<Users size={16} />} special />
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <span className="size-2 bg-brand-gold rounded-full" />
                                Actividad Reciente
                            </h3>
                            <button className="text-[13px] font-black text-brand-gold uppercase tracking-widest hover:tracking-[0.2em] transition-all">Reporte Global</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-bold bg-zinc-50/50 dark:bg-transparent">
                                    <tr>
                                        <th className="px-8 py-4">Colaborador</th>
                                        <th className="px-8 py-4">Asignación</th>
                                        <th className="px-8 py-4">Estatus</th>
                                        <th className="px-8 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    <TableRow rfc="GOMJ880214" name="Juan Gómez Martínez" type="Calzado / Ejecutivo" status="entregado" />
                                    <TableRow rfc="PERL901005" name="Lucía Pérez Ramos" type="Uniforme Gala" status="pendiente" />
                                    <TableRow rfc="MARA920315" name="Marcos Rayas" type="Equipo Táctico" status="entregado" />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-3 w-full px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
            active
                ? 'bg-brand-gold/10 text-brand-gold font-bold shadow-sm shadow-brand-gold/5'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
        }`}
    >
        <span className={active ? 'text-brand-gold' : 'group-hover:text-brand-gold transition-colors'}>{icon}</span>
        <span className="text-xs uppercase tracking-widest">{label}</span>
    </button>
);

const StatCard = ({ label, value, color, icon, isMain, special }) => (
    <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 hover:-translate-y-2 ${
        special ? 'bg-brand-gold border-transparent shadow-xl shadow-brand-gold/20' :
        'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800'
    }`}>
        <div className="flex justify-between items-center mb-4">
            <p className={`text-[9px] uppercase font-bold tracking-[0.2em] ${special ? 'text-white/70' : 'text-zinc-400'}`}>
                {label}
            </p>
            <div className={`${special ? 'text-white/40' : 'text-zinc-300'}`}>{icon}</div>
        </div>
        <p className={`text-4xl font-black tracking-tighter ${special ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
            {value}
        </p>
        <div className={`h-1.5 w-10 mt-6 rounded-full ${special ? 'bg-white/30' : 'bg-brand-gold'}`} />
    </div>
);

const TableRow = ({ rfc, name, type, status }) => (
    <tr className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
        <td className="px-8 py-6">
            <p className="font-bold dark:text-white uppercase tracking-wider text-[11px]">{rfc}</p>
            <p className="text-[13px] text-zinc-500 mt-1 font-medium">{name}</p>
        </td>
        <td className="px-8 py-6">
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">{type}</span>
        </td>
        <td className="px-8 py-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                status === 'entregado'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20'
                    : 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
            }`}>
                {status}
            </span>
        </td>
        <td className="px-8 py-6 text-right">
            <button className="size-9 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-brand-gold group-hover:text-white transition-all transform group-hover:rotate-90">
                <ChevronRight size={16} />
            </button>
        </td>
    </tr>
);

export default DashboardSIVSO;
