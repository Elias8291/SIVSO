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
                <h1 className="text-3xl sm:text-4xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Bienvenido, <span className="font-medium">{empleado?.nombre || user?.name || 'Colaborador'}</span>
                </h1>
                {empleado?.dependencia_clave && (
                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-light flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {empleado.dependencia_clave}
                        {empleado.delegacion_clave ? <span className="opacity-60">• Delegación {empleado.delegacion_clave}</span> : ''}
                    </p>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna Izquierda: Info y CTA */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Tarjeta de Periodo */}
                    {periodo && (
                        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-100 p-7 text-white dark:text-zinc-900 shadow-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-5 pointer-events-none">
                                <Calendar size={100} strokeWidth={1} />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 dark:bg-black/5 text-xs font-medium mb-6 backdrop-blur-md border border-white/10 dark:border-black/10">
                                    <Sparkles size={14} className="text-amber-300 dark:text-amber-600" />
                                    Periodo Activo
                                </div>
                                <h2 className="text-2xl font-medium mb-2 tracking-tight">{periodo.nombre}</h2>
                                {periodo.fecha_fin && (
                                    <p className="text-sm text-zinc-300 dark:text-zinc-600 font-light">
                                        Válido hasta el {periodo.fecha_fin}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tarjeta de Acción */}
                    <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 p-7 backdrop-blur-sm shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                            <Shirt size={20} className="text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                            Gestión de Vestuario
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                            Revise las prendas que le han sido asignadas. Puede confirmar sus tallas o solicitar cambios según el catálogo disponible.
                        </p>
                        <Link
                            to={ROUTES.MI_VESTUARIO}
                            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm hover:shadow"
                        >
                            Ir a mi vestuario
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Columna Derecha: Lista de Prendas */}
                <div className="lg:col-span-7">
                    {!empleado ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                                <Users size={24} className="text-zinc-400" />
                            </div>
                            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                Sin vinculación
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                                Para ver sus asignaciones, es necesario vincular su número de empleado (NUE).
                            </p>
                            <Link 
                                to={ROUTES.MI_CUENTA} 
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                            >
                                Ir a Mi cuenta
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden h-full flex flex-col">
                            <div className="flex items-center justify-between px-7 py-6 border-b border-zinc-100 dark:border-zinc-800/60">
                                <div>
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">
                                        Prendas Asignadas
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {totalPiezas} piezas en total
                                    </p>
                                </div>
                                {asignaciones.length > 5 && (
                                    <Link
                                        to={ROUTES.MI_VESTUARIO}
                                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                                    >
                                        Ver todas <ArrowRight size={14} />
                                    </Link>
                                )}
                            </div>
                            
                            <div className="p-3 flex-1 flex flex-col">
                                {preview.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center py-12 text-center">
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            No hay artículos registrados en su vestuario actual.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {preview.map((item) => (
                                            <div 
                                                key={item.id} 
                                                className="group flex items-center gap-4 p-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-sm transition-all border border-transparent group-hover:border-zinc-200/50 dark:group-hover:border-zinc-700/50">
                                                    <Shirt size={20} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                        {item.descripcion || 'Artículo'}
                                                    </p>
                                                    <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] tracking-wider">
                                                            {item.clave_vestuario || item.codigo || '—'}
                                                        </span>
                                                        {item.talla && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                                                                <span className="font-medium">Talla {item.talla}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right pr-2">
                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] h-9 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-sm font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                                                        {item.cantidad ?? 1}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
