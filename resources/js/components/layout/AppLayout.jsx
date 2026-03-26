import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const AppLayout = () => {
    const { mustChangePassword } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (mustChangePassword) {
            window.location.replace('/cambiar-contrasena');
        }
    }, [mustChangePassword]);

    if (mustChangePassword) return null;

    return (
        <div className="flex min-h-screen text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
            <main
                className={`relative flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}
            >
                {/* Misma marca de agua que AuthLayout (login): minimalista, no interactiva */}
                <span className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none select-none" aria-hidden="true">
                    <span className="text-[7.5rem] sm:text-[16rem] lg:text-[20rem] font-black tracking-[0.2em] text-brand-gold/10 dark:text-brand-gold/15 leading-none italic">
                        SIVSO
                    </span>
                </span>
                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                    <div className="flex-1 px-3 py-5 sm:px-6 sm:py-8 xl:px-14 xl:py-12 w-full max-w-full overflow-x-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
