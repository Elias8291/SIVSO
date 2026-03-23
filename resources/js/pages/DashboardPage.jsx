import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users, Shirt, ArrowRight, Calendar, Sparkles,
} from 'lucide-react';
import { StatCard, PageHeader, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { ROUTES } from '../config/routes';

const KPI_ITEMS = [
    { label: 'Stock Total', value: '4,812', icon: <TrendingUp size={15} strokeWidth={1.8} /> },
    { label: 'Pendientes', value: '24', icon: <Clock size={15} strokeWidth={1.8} /> },
    { label: 'Completados', value: '912', icon: <CheckCircle size={15} strokeWidth={1.8} /> },
    { label: 'Sindicatos', value: '08', icon: <Users size={15} strokeWidth={1.8} /> },
];

/** Solo rol `empleado` (sin admin, delegado ni consulta): panel reducido */
function esVistaColaboradorVestuario(roles) {
    if (!Array.isArray(roles) || roles.length === 0) return false;
    const bloqueados = ['admin', 'delegado', 'consulta'];
    if (roles.some((r) => bloqueados.includes(r))) return false;
    return roles.includes('empleado');
}

function DashboardEmpleado() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/api/mi-vestuario')
            .then((res) => setData(res))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const empleado = data?.empleado;
    const asignaciones = data?.asignaciones ?? [];
    const preview = asignaciones.slice(0, 5);
    const totalPiezas = asignaciones.reduce((acc, a) => acc + (Number(a.cantidad) || 0), 0);
    const periodo = data?.periodo_activo;

    if (loading) {
        return (
            <div className="flex items-center justify-start py-20 pl-4 sm:pl-8">
                <div className="flex flex-col items-start gap-4">
                    <span className="size-6 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cargando su información...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl text-left space-y-8 pb-12">
            {/* Encabezado Principal y Acciones */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Hola, {empleado?.nombre || user?.name || 'Colaborador'}
                    </h1>
                    {empleado?.dependencia_clave && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {empleado.dependencia_clave}
                            {empleado.delegacion_clave ? <span className="text-zinc-300 dark:text-zinc-600">•</span> : ''}
                            {empleado.delegacion_clave ? `Delegación ${empleado.delegacion_clave}` : ''}
                        </p>
                    )}
                </div>
                <div className="shrink-0">
                    <Link
                        to={ROUTES.MI_VESTUARIO}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                    >
                        Gestionar vestuario
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </header>

            {/* Banner de Periodo (Minimalista) */}
            {periodo && (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Periodo de asignación activo: {periodo.nombre}
                        </p>
                        {periodo.fecha_fin && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Disponible hasta el {periodo.fecha_fin}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Sección de Prendas (Grid Minimalista) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        Prendas asignadas ({totalPiezas})
                    </h3>
                    {asignaciones.length > 5 && (
                        <Link
                            to={ROUTES.MI_VESTUARIO}
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                        >
                            Ver todas <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {!empleado ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <Users size={20} className="text-zinc-400" />
                        </div>
                        <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            Sin vinculación
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                            Para ver sus asignaciones, es necesario vincular su número de empleado (NUE).
                        </p>
                        <Link 
                            to={ROUTES.MI_CUENTA} 
                            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Ir a Mi cuenta
                        </Link>
                    </div>
                ) : (
                    <>
                        {preview.length === 0 ? (
                            <div className="flex items-center justify-center py-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    No hay artículos registrados en su vestuario actual.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {preview.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex flex-col p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                                                <Shirt size={18} strokeWidth={1.5} />
                                            </div>
                                            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                x{item.cantidad ?? 1}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-4 flex-1">
                                            {item.descripcion || 'Artículo'}
                                        </h4>
                                        
                                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                                            <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-400 truncate">
                                                {item.clave_vestuario || item.codigo || '—'}
                                            </span>
                                            {item.talla && (
                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                                                    Talla {item.talla}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { roles } = useAuth();

    if (esVistaColaboradorVestuario(roles)) {
        return <DashboardEmpleado />;
    }

    return (
        <div>
            <PageHeader
                title="Panel de Control"
                description="Resumen operativo — Sistema de Vestuario y Calzado"
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {KPI_ITEMS.map((item) => (
                    <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        icon={item.icon}
                    />
                ))}
            </div>
        </div>
    );
}
