import { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRouteLabel } from '../../config/routes';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
    const { can } = useAuth();
    const showNotificaciones = can('ver_notificaciones');
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [noLeidas, setNoLeidas] = useState(0);

    const currentPath = location.pathname;
    const pageLabel = getRouteLabel(currentPath);

    useEffect(() => {
        if (!showNotificaciones) {
            setNoLeidas(0);
            return undefined;
        }
        let active = true;
        const check = () =>
            fetch('/api/notificaciones/conteo', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
                .then(r => r.json())
                .then(d => { if (active) setNoLeidas(d.no_leidas ?? 0); })
                .catch(() => {});

        check();
        const id = setInterval(check, 30000);
        return () => { active = false; clearInterval(id); };
    }, [showNotificaciones]);

    return (
        <header className="h-14 sm:h-16 bg-[#F7F7F8]/80 dark:bg-[#060607]/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 sticky top-0 z-50 flex items-center justify-between px-3 sm:px-8 xl:px-14">

            {/* Breadcrumb + menú móvil */}
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
                    aria-label="Abrir menú"
                >
                    <Menu size={20} strokeWidth={1.8} />
                </button>
                <span className="text-[12px] text-zinc-400 dark:text-zinc-600 font-medium tracking-wider uppercase">
                    SIVSO
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 text-xs">/</span>
                <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
                    {pageLabel}
                </span>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1.5">
                {/* Notificaciones */}
                {showNotificaciones && (
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/notificaciones')}
                        className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
                        aria-label="Notificaciones"
                    >
                        <Bell size={16} strokeWidth={1.8} />
                        {noLeidas > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                                {noLeidas > 9 ? '9+' : noLeidas}
                            </span>
                        )}
                    </button>
                )}

                {/* Toggle tema */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleTheme();
                    }}
                    className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 active:bg-zinc-200/80 dark:active:bg-zinc-700/60 transition-all touch-manipulation [-webkit-tap-highlight-color:transparent]"
                    aria-label="Cambiar tema"
                >
                    {isDarkMode
                        ? <Sun size={16} strokeWidth={1.8} />
                        : <Moon size={16} strokeWidth={1.8} />
                    }
                </button>
            </div>
        </header>
    );
};

export default Header;
