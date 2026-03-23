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
        <div className="w-full max-w-6xl text-left space-y-10 pb-12">
            {/* Encabezado Principal */}
            <header className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Hola, {empleado?.nombre || user?.name || 'Colaborador'}
                </h1>
                {empleado?.dependencia_clave && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {empleado.dependencia_clave}
                        {empleado.delegacion_clave ? <span className="text-zinc-300 dark:text-zinc-600">•</span> : ''}
                        {empleado.delegacion_clave ? `Delegación ${empleado.delegacion_clave}` : ''}
                    </p>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarjeta de Periodo */}
                {periodo && (
                    <div className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-100 p-8 text-white dark:text-zinc-900 shadow-sm flex flex-col justify-center">
                        <div className="absolute -bottom-4 -right-4 p-6 opacity-10 dark:opacity-5 pointer-events-none">
                            <Calendar size={140} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 dark:bg-black/5 text-xs font-semibold mb-4 backdrop-blur-md border border-white/10 dark:border-black/10">
                                <Sparkles size={14} className="text-amber-300 dark:text-amber-600" />
                                Periodo Activo
                            </div>
                            <h2 className="text-2xl font-semibold mb-1 tracking-tight">{periodo.nombre}</h2>
                            {periodo.fecha_fin && (
                                <p className="text-sm text-zinc-300 dark:text-zinc-600 font-medium">
                                    Válido hasta el {periodo.fecha_fin}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Tarjeta de Acción */}
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm flex flex-col justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <Shirt size={20} className="text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Gestión de Vestuario
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                        Revise las prendas que le han sido asignadas. Puede confirmar sus tallas o solicitar cambios según el catálogo disponible.
                    </p>
                    <div className="mt-auto">
                        <Link
                            to={ROUTES.MI_VESTUARIO}
                            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm"
                        >
                            Ir a mi vestuario
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Sección de Prendas (Grid de Tarjetas) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Prendas Asignadas
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                            {totalPiezas} piezas en total
                        </p>
                    </div>
                    {asignaciones.length > 5 && (
                        <Link
                            to={ROUTES.MI_VESTUARIO}
                            className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                        >
                            Ver todas <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {!empleado ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <Users size={28} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            Sin vinculación
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
                            Para ver sus asignaciones, es necesario vincular su número de empleado (NUE).
                        </p>
                        <Link 
                            to={ROUTES.MI_CUENTA} 
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                        >
                            Ir a Mi cuenta
                        </Link>
                    </div>
                ) : (
                    <>
                        {preview.length === 0 ? (
                            <div className="flex items-center justify-center py-16 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    No hay artículos registrados en su vestuario actual.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                {preview.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="group relative flex flex-col items-center text-center p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md"
                                    >
                                        {/* Badge de cantidad */}
                                        <div className="absolute top-4 right-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold px-2 py-1 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                            x{item.cantidad ?? 1}
                                        </div>

                                        {/* Icono central */}
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 group-hover:scale-110 transition-all duration-300">
                                            <Shirt size={28} strokeWidth={1.5} />
                                        </div>

                                        {/* Info de la prenda */}
                                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 w-full">
                                            {item.descripcion || 'Artículo'}
                                        </h4>
                                        
                                        <div className="mt-auto flex flex-col items-center gap-2 w-full pt-2">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                                                {item.clave_vestuario || item.codigo || '—'}
                                            </span>
                                            {item.talla && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-full">
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
