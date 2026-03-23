import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, Users, UsersRound, Shield, Lock, Network, Shirt, Package, BarChart2, Building2, UserCheck, X, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SIDEBAR_SECTIONS } from '../../config/routes';
import NavItem from '../ui/NavItem';

const ICON_MAP = {
    LayoutDashboard,
    User,
    Users,
    UsersRound,
    Shield,
    Lock,
    Network,
    Shirt,
    Package,
    BarChart2,
    Building2,
    UserCheck,
};

const Sidebar = ({ isOpen = false, onClose = () => {}, collapsed = false, onToggleCollapse = () => {} }) => {
    const { logout, logoutUrl, csrfToken, user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            {/* Overlay móvil */}
            <div
                role="button"
                tabIndex={0}
                onClick={onClose}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={!isOpen}
                aria-label="Cerrar menú"
            />

            <aside
                className={`fixed inset-y-0 left-0 bg-white dark:bg-[#0A0A0B] border-r border-zinc-100 dark:border-zinc-800/80 flex flex-col z-50 transition-all duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    ${collapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
            >
                {/* Marca + botón cerrar móvil + toggle colapsar (desktop) */}
                <div className={`pt-6 pb-5 flex items-center shrink-0 transition-all duration-300 ${
                    collapsed ? 'lg:px-0 lg:justify-center' : 'px-6 justify-between'
                }`}>
                    <h1 className={`text-sm font-extrabold tracking-[0.15em] dark:text-white leading-none shrink-0 ${
                        collapsed ? 'lg:hidden' : ''
                    }`}>SIVSO</h1>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
                            aria-label="Cerrar menú"
                        >
                            <X size={18} strokeWidth={1.8} />
                        </button>
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            className="hidden lg:flex p-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all justify-center"
                            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                        >
                            {collapsed ? <PanelLeft size={18} strokeWidth={1.8} /> : <PanelLeftClose size={18} strokeWidth={1.8} />}
                        </button>
                    </div>
                </div>

            <div className={`h-px bg-zinc-100 dark:bg-zinc-800/80 shrink-0 ${collapsed ? 'lg:mx-2' : 'mx-6'}`} />

            {/* Contenedor con scroll (nav + footer) para que en móvil se vea el logout */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                <nav className={`py-4 space-y-5 shrink-0 transition-all duration-300 ${collapsed ? 'lg:px-2' : 'px-3'}`} onClick={onClose}>
                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.label}>
                            {!collapsed && (
                                <p className="px-4 mb-1.5 text-[13px] font-bold text-zinc-400 uppercase tracking-[0.25em]">
                                    {section.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {section.links.map(({ path, label, iconKey }) => {
                                    const IconComponent = ICON_MAP[iconKey];
                                    return (
                                        <NavLink
                                            key={path}
                                            to={path}
                                            end={path === '/dashboard'}
                                            className="block [&.active]:cursor-default"
                                        >
                                            {({ isActive }) => (
                                                <NavItem
                                                    icon={IconComponent ? <IconComponent size={16} strokeWidth={1.8} /> : null}
                                                    label={label}
                                                    active={isActive}
                                                    collapsed={collapsed}
                                                />
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Usuario + Logout - siempre accesible al hacer scroll en móvil */}
                <div className={`shrink-0 pb-5 pt-2 transition-all duration-300 ${collapsed ? 'lg:px-2' : 'px-3'}`}>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 mb-3" />

                {!collapsed && (
                    <p className="px-4 py-2 mb-1 text-[13px] font-semibold text-zinc-600 dark:text-zinc-400 truncate">
                        {user?.name ?? 'Usuario'}
                    </p>
                )}

                <form id="logout-form" method="POST" action={logoutUrl || '/logout'}>
                    <input type="hidden" name="_token" value={csrfToken || ''} />
                </form>
                <button
                    type="button"
                    onClick={logout}
                    className={`flex items-center w-full py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-[13px] font-semibold group ${
                        collapsed ? 'lg:justify-center lg:px-0' : 'gap-2.5 px-4'
                    }`}
                >
                    <LogOut size={14} strokeWidth={1.8} className="shrink-0" />
                    {!collapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
            </div>
        </aside>
        </>
    );
};

export default Sidebar;
