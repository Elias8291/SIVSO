import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users, Shirt, ArrowRight, Calendar, Layers,
} from 'lucide-react';
import { StatCard, PageHeader } from '../components/ui';
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

function Spinner({ label }) {
    return (
        <div className="flex min-h-[40vh] items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <span className="size-7 border-2 border-zinc-200 dark:border-zinc-800 border-t-brand-gold rounded-full animate-spin" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
        </div>
    );
}

/** Panel colaborador: acentos brand-gold y zinc (identidad SIVSO) */
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
    const preview = asignaciones.slice(0, 6);
    const totalPiezas = asignaciones.reduce((acc, a) => acc + (Number(a.cantidad) || 0), 0);
    const periodo = data?.periodo_activo;

    if (loading) {
        return <Spinner label="Cargando tu vestuario…" />;
    }

    return (
        <div className="mx-auto w-full max-w-lg pb-16 pt-1">
            <div className="rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-brand-gold/[0.07] to-white px-6 py-8 shadow-sm dark:border-zinc-800/90 dark:from-brand-gold/[0.06] dark:to-zinc-900/40 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                    Tu vestuario
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {empleado?.nombre || user?.name || 'Colaborador'}
                </h1>
                {(empleado?.dependencia_clave || empleado?.delegacion_clave) && (
                    <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {[empleado.dependencia_clave, empleado.delegacion_clave ? `Deleg. ${empleado.delegacion_clave}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                )}

                <div className="mt-6">
                    <Link
                        to={ROUTES.MI_VESTUARIO}
                        className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                        Ver y gestionar prendas
                        <ArrowRight size={16} strokeWidth={2} />
                    </Link>
                </div>

                {periodo && (
                    <p className="mt-6 flex items-start gap-2 border-t border-zinc-200/70 pt-5 text-sm text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400">
                        <Calendar size={16} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={1.8} />
                        <span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Periodo activo:</span>{' '}
                            {periodo.nombre}
                            {periodo.fecha_fin ? (
                                <span className="block text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                                    Hasta {periodo.fecha_fin}
                                </span>
                            ) : null}
                        </span>
                    </p>
                )}
            </div>

            <div className="mt-8">
                {!empleado ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-5 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                        <Users size={22} className="mx-auto text-zinc-400" strokeWidth={1.5} />
                        <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">Sin vinculación</p>
                        <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                            Vincula tu NUE en Mi cuenta para ver asignaciones.
                        </p>
                        <Link
                            to={ROUTES.MI_CUENTA}
                            className="mt-5 inline-block text-sm font-medium text-brand-gold underline-offset-4 hover:underline"
                        >
                            Ir a Mi cuenta
                        </Link>
                    </div>
                ) : preview.length === 0 ? (
                    <p className="rounded-xl border border-zinc-200/80 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        No hay artículos en tu vestuario por ahora.
                    </p>
                ) : (
                    <>
                        <div className="mb-3 flex items-baseline justify-between gap-2">
                            <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                Resumen
                            </h2>
                            <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                                {totalPiezas} pieza{totalPiezas !== 1 ? 's' : ''}
                                {asignaciones.length > preview.length ? ` · ${asignaciones.length} ítems` : ''}
                            </span>
                        </div>
                        <ul className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
                            {preview.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 last:border-0 dark:border-zinc-800/80"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                                        <Shirt size={16} strokeWidth={1.7} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {item.descripcion || 'Artículo'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                            {[item.clave_vestuario || item.codigo, item.talla ? `Talla ${item.talla}` : null]
                                                .filter(Boolean)
                                                .join(' · ') || '—'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                                        ×{item.cantidad ?? 1}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {asignaciones.length > preview.length && (
                            <Link
                                to={ROUTES.MI_VESTUARIO}
                                className="mt-3 block text-center text-sm font-medium text-brand-gold hover:opacity-90"
                            >
                                Ver todo el vestuario
                            </Link>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/** Panel delegado: misma familia cromática (zinc + brand-gold), métricas en franja */
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
    const preview = delegaciones.slice(0, 4);

    if (loading) {
        return <Spinner label="Cargando delegación…" />;
    }

    return (
        <div className="mx-auto w-full max-w-3xl pb-16 pt-1">
            <div className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-brand-gold/[0.05] via-white to-zinc-50/40 shadow-sm dark:border-zinc-800/90 dark:from-brand-gold/[0.05] dark:via-zinc-950 dark:to-zinc-950">
                <div className="border-b border-zinc-200/70 px-6 py-7 dark:border-zinc-800/80 sm:px-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                        Coordinación
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {user?.name || 'Delegado'}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Ejercicio {ejercicio} · seguimiento de vestuario por delegación
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                            to={ROUTES.MI_DELEGACION}
                            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                            Colaboradores
                            <ArrowRight size={16} strokeWidth={2} />
                        </Link>
                        {can('ver_selecciones') && (
                            <Link
                                to={ROUTES.MI_VESTUARIO}
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-300/90 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                                <Shirt size={16} strokeWidth={1.6} />
                                Mi vestuario
                            </Link>
                        )}
                    </div>
                </div>

                {sinAlcance ? (
                    <div className="px-6 py-12 text-center sm:px-8">
                        <Layers size={28} className="mx-auto text-brand-gold/90" strokeWidth={1.4} />
                        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">Sin delegaciones asignadas</p>
                        <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                            {payload?.message || 'Revisa tu perfil en Mi cuenta o el padrón con NUE de delegación.'}
                        </p>
                        <Link
                            to={ROUTES.MI_CUENTA}
                            className="mt-5 inline-block text-sm font-medium text-brand-gold underline-offset-4 hover:underline"
                        >
                            Ir a Mi cuenta
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {periodo && (
                            <div className="flex items-start gap-3 border-b border-zinc-200/60 bg-white/40 px-6 py-4 dark:border-zinc-800/60 dark:bg-zinc-950/20 sm:px-8">
                                <Calendar size={17} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={1.8} />
                                <div className="min-w-0 text-sm text-zinc-600 dark:text-zinc-400">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Periodo:</span>{' '}
                                    {periodo.nombre}
                                    {periodo.fecha_fin ? (
                                        <span className="block text-xs text-zinc-500 mt-0.5">Cierre {periodo.fecha_fin}</span>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 divide-x divide-zinc-200/80 border-b border-zinc-200/60 dark:divide-zinc-800 dark:border-zinc-800/60">
                            <div className="px-3 py-4 text-center sm:px-4">
                                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                    {resumen.delegaciones_count ?? 0}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    Delegaciones
                                </p>
                            </div>
                            <div className="px-3 py-4 text-center sm:px-4">
                                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                    {resumen.colaboradores_total ?? 0}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    Colaboradores
                                </p>
                            </div>
                            <div className="px-3 py-4 text-center sm:px-4">
                                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                    {resumen.porcentaje_actualizado ?? 0}%
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    Actualizados
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-3 dark:bg-zinc-950/10 sm:px-8">
                            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-brand-gold transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(0, Number(resumen.porcentaje_actualizado) || 0))}%` }}
                                />
                            </div>
                            <p className="mt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                                {resumen.actualizados_ejercicio ?? 0} de {resumen.colaboradores_total ?? 0} con selección en {ejercicio}
                                {(resumen.pendientes_actualizar ?? 0) > 0 && (
                                    <span> · {resumen.pendientes_actualizar} pendientes</span>
                                )}
                            </p>
                        </div>

                        <div className="px-6 pb-8 pt-2 sm:px-8">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Por delegación</h2>
                                {delegaciones.length > preview.length && (
                                    <Link
                                        to={ROUTES.MI_DELEGACION}
                                        className="text-xs font-medium text-brand-gold hover:underline"
                                    >
                                        Ver todas
                                    </Link>
                                )}
                            </div>
                            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
                                {preview.map((del) => {
                                    const total = del.trabajadores_count ?? 0;
                                    const act = del.actualizados_ejercicio ?? 0;
                                    const pctDel = total > 0 ? Math.round((100 * act) / total) : 0;
                                    return (
                                        <li key={del.id} className="flex items-center gap-3 px-4 py-3.5">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {del.clave}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {act}/{total} actualizados · {pctDel}%
                                                </p>
                                            </div>
                                            <Link
                                                to={ROUTES.MI_DELEGACION}
                                                className="shrink-0 text-xs font-medium text-brand-gold hover:opacity-90"
                                            >
                                                Lista →
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
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
