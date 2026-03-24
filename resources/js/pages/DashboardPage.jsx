import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users, Shirt, ArrowRight, Calendar, Building2,
    UserCheck, Layers, BarChart3,
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

/** Delegado operativo (no admin): panel con alcance de delegaciones */
function esVistaDelegadoOperativo(roles, can) {
    if (!Array.isArray(roles) || !roles.includes('delegado')) return false;
    if (roles.includes('admin')) return false;
    return can('ver_mi_delegacion');
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

function DashboardDelegado() {
    const { user, can } = useAuth();
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/api/mi-delegacion')
            .then((res) => setPayload(res))
            .catch(() => setPayload(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const resumen = payload?.resumen;
    const delegaciones = payload?.data ?? [];
    const sinAlcance = !loading && (!delegaciones.length || !resumen);
    const periodo = resumen?.periodo_activo;
    const ejercicio = resumen?.ejercicio_vigente ?? new Date().getFullYear();
    const preview = delegaciones.slice(0, 6);

    if (loading) {
        return (
            <div className="flex items-center justify-start py-20 pl-4 sm:pl-8">
                <div className="flex flex-col items-start gap-4">
                    <span className="size-6 border-2 border-zinc-200 dark:border-zinc-800 border-t-amber-600 dark:border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cargando tu panel de delegación…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl text-left space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700/90 dark:text-amber-400/90">
                        Panel delegado
                    </p>
                    <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Hola, {user?.name || 'Delegado'}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl leading-relaxed">
                        Seguimiento del vestuario de tus colaboradores en el ejercicio <span className="text-amber-700 dark:text-amber-400 font-semibold">{ejercicio}</span>
                        {' '}y acceso rápido a cada delegación.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Link
                        to={ROUTES.MI_DELEGACION}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                    >
                        Gestionar colaboradores
                        <ArrowRight size={16} />
                    </Link>
                    {can('ver_selecciones') && (
                        <Link
                            to={ROUTES.MI_VESTUARIO}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
                        >
                            <Shirt size={16} strokeWidth={1.6} />
                            Mi vestuario
                        </Link>
                    )}
                </div>
            </header>

            {sinAlcance ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-gradient-to-b from-zinc-50/80 to-transparent dark:from-zinc-900/40">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100/90 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <Layers size={26} className="text-amber-700 dark:text-amber-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        Sin delegaciones asignadas
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
                        {payload?.message || 'Vincula tu perfil como delegado en Mi cuenta o asegúrate de tener NUE con delegación en el padrón.'}
                    </p>
                    <Link
                        to={ROUTES.MI_CUENTA}
                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                        Ir a Mi cuenta
                    </Link>
                </div>
            ) : (
                <>
                    {periodo && (
                        <div className="flex items-start gap-4 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-white dark:from-amber-950/25 dark:to-zinc-900/40">
                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                                <Calendar size={20} className="text-amber-700 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Periodo de actualización: {periodo.nombre}
                                </p>
                                {periodo.fecha_fin && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Cierra el {periodo.fecha_fin} · Los colaboradores deben confirmar su vestuario en el ejercicio {ejercicio}.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm shadow-black/[0.03]">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
                                <Building2 size={16} strokeWidth={1.7} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Delegaciones</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                                {resumen.delegaciones_count}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">Códigos bajo tu alcance</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm shadow-black/[0.03]">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
                                <UserCheck size={16} strokeWidth={1.7} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Delegados</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                                {resumen.delegados_registro_count}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">Registros en padrón (nombre)</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm shadow-black/[0.03]">
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
                                <Users size={16} strokeWidth={1.7} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Colaboradores</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                                {resumen.colaboradores_total}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">Trabajadores en esas UR</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-zinc-900 p-4 sm:p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                <CheckCircle size={16} strokeWidth={1.7} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Actualizados {ejercicio}</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                                {resumen.actualizados_ejercicio}
                                <span className="text-base sm:text-lg font-semibold text-zinc-400 dark:text-zinc-500">
                                    {' '}/ {resumen.colaboradores_total}
                                </span>
                            </p>
                            <div className="mt-3 h-2 rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${resumen.porcentaje_actualizado}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-2 font-medium">
                                {resumen.porcentaje_actualizado}% con selección en el ejercicio vigente
                                {resumen.pendientes_actualizar > 0 && (
                                    <span className="text-zinc-500 dark:text-zinc-400 font-normal">
                                        {' · '}{resumen.pendientes_actualizar} pendientes
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-zinc-400" strokeWidth={1.6} />
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                    Por delegación
                                </h3>
                            </div>
                            {delegaciones.length > preview.length && (
                                <Link
                                    to={ROUTES.MI_DELEGACION}
                                    className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    Ver todas <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {preview.map((del) => {
                                const total = del.trabajadores_count ?? 0;
                                const act = del.actualizados_ejercicio ?? 0;
                                const pctDel = total > 0 ? Math.round((100 * act) / total) : 0;
                                return (
                                    <div
                                        key={del.id}
                                        className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-amber-300/50 dark:hover:border-amber-800/40 transition-colors shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Delegación</p>
                                                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                                                    {del.clave}
                                                </p>
                                            </div>
                                            <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                                {act}/{total}
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
                                            <div
                                                className="h-full rounded-full bg-amber-500 dark:bg-amber-500"
                                                style={{ width: `${pctDel}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 flex-1">
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{act}</span>
                                            {' '}de{' '}
                                            <span className="font-semibold">{total}</span>
                                            {' '}colaboradores ya registraron vestuario en {ejercicio}.
                                        </p>
                                        <Link
                                            to={ROUTES.MI_DELEGACION}
                                            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
                                        >
                                            Abrir lista
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { roles, can } = useAuth();

    if (esVistaColaboradorVestuario(roles)) {
        return <DashboardEmpleado />;
    }

    if (esVistaDelegadoOperativo(roles, can)) {
        return <DashboardDelegado />;
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
