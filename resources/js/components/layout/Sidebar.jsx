import { NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, Users, UsersRound, Shield, Lock, Network, Shirt, Package, BarChart2 } from 'lucide-react';
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
};

const Sidebar = () => {
    const { logout, logoutUrl, csrfToken, user } = useAuth();

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AD';

    return (
        <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0A0A0B] border-r border-zinc-100 dark:border-zinc-800/80 hidden lg:flex flex-col z-50">

            {/* Marca */}
            <div className="px-6 pt-6 pb-5">
                <h1 className="text-sm font-extrabold tracking-[0.15em] dark:text-white leading-none">SIVSO</h1>
            </div>

            <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800/80" />

            {/* Navegación por secciones */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {SIDEBAR_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <p className="px-4 mb-1.5 text-[8px] font-bold text-zinc-400 uppercase tracking-[0.25em]">
                            {section.label}
                        </p>
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
                                            />
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Usuario + Logout */}
            <div className="px-3 pb-5">
                <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 mb-3" />

                {/* Info usuario */}
                <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                    <div className="size-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-[#AF9460]">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-none truncate">{user?.name ?? 'Usuario'}</p>
                        <p className="text-[9px] text-zinc-400 leading-none mt-0.5 truncate">{user?.email ?? ''}</p>
                    </div>
                </div>

                <form id="logout-form" method="POST" action={logoutUrl || '/logout'}>
                    <input type="hidden" name="_token" value={csrfToken || ''} />
                </form>
                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-[11px] font-semibold group"
                >
                    <LogOut size={14} strokeWidth={1.8} />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
