import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users, Shirt, ArrowRight, Calendar, Layers, CircleAlert,
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

/** Nombres técnicos o genéricos del periodo: no mostrar como título legible */
function nombrePeriodoLegible(nombre) {
    const raw = String(nombre ?? '').trim();
    if (!raw) return null;
    if (/^(activate|active|activo|abierto|open|enabled)$/i.test(raw)) return null;
    return raw;
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
    const ejercicio = data?.ejercicio_vigente ?? new Date().getFullYear();
    const edicionCerrada = data?.edicion_cerrada_ejercicio_vigente ?? false;
    const puedeEditar = data?.puede_editar_vestuario ?? false;
    const periodoTitulo = periodo ? nombrePeriodoLegible(periodo.nombre) : null;
    const enPeriodoSinCerrar = Boolean(empleado && periodo && !edicionCerrada && puedeEditar);
    const enPeriodoYaEnviado = Boolean(empleado && periodo && edicionCerrada);

    if (loading) {
        return <Spinner label="Cargando tu vestuario…" />;
    }

    const layoutDosColumnas = Boolean(empleado && preview.length > 0);

    const bloqueSaludo = (
        <>
            <div className="mb-3 h-0.5 w-9 rounded-full bg-brand-gold/90" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
                Tu vestuario
            </p>
            <h1
                className={`mt-1 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 ${
                    layoutDosColumnas ? 'text-xl lg:text-2xl lg:tracking-tight' : 'text-xl'
                }`}
            >
                {empleado?.nombre || user?.name || 'Colaborador'}
            </h1>
            {(empleado?.dependencia_clave || empleado?.delegacion_clave) && (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {[empleado.dependencia_clave, empleado.delegacion_clave ? `Deleg. ${empleado.delegacion_clave}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            )}

            <div className="mt-4">
                <Link
                    to={ROUTES.MI_VESTUARIO}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white lg:px-5 lg:py-2.5"
                >
                    Mi vestuario
                    <ArrowRight size={15} strokeWidth={2} />
                </Link>
            </div>

            {periodo && empleado && (
                <div className="mt-4 space-y-2 border-t border-zinc-200/70 pt-4 dark:border-zinc-800/80">
                    <p className="flex items-start gap-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                        <Calendar size={14} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={2} />
                        <span>
                            {periodoTitulo ? (
                                <>
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{periodoTitulo}</span>
                                    {periodo.fecha_fin ? (
                                        <span className="text-zinc-500 dark:text-zinc-500"> · Hasta {periodo.fecha_fin}</span>
                                    ) : null}
                                </>
                            ) : periodo.fecha_fin ? (
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">Hasta {periodo.fecha_fin}</span>
                            ) : (
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">Periodo de actualización abierto</span>
                            )}
                        </span>
                    </p>
                    {enPeriodoSinCerrar && (
                        <p className="flex items-start gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-2 text-[11px] leading-snug text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                            <CircleAlert size={14} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={2} />
                            <span>
                                Actualiza o confirma tus prendas en{' '}
                                <Link to={ROUTES.MI_VESTUARIO} className="font-medium text-brand-gold underline-offset-2 hover:underline">
                                    Mi vestuario
                                </Link>
                                {' '}y guarda los cambios antes del cierre.
                            </span>
                        </p>
                    )}
                    {enPeriodoYaEnviado && (
                        <p className="flex items-start gap-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                            <CheckCircle size={14} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={2} />
                            <span>Ya enviaste tu vestuario para el ejercicio {ejercicio}.</span>
                        </p>
                    )}
                </div>
            )}
        </>
    );

    const bloquePrendas = (
        <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80 sm:mb-4 sm:gap-3 sm:pb-3.5">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-gold">Asignación</p>
                    <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 lg:text-base">
                        Prendas
                    </h2>
                </div>
                <span className="shrink-0 rounded-lg bg-zinc-100/90 px-2.5 py-1 text-[11px] font-medium tabular-nums text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
                    {totalPiezas} pieza{totalPiezas !== 1 ? 's' : ''}
                    {asignaciones.length > preview.length ? ` · ${asignaciones.length} ítems` : ''}
                </span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {preview.map((item) => (
                    <li
                        key={item.id}
                        className="flex w-full min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:px-1 lg:py-3.5 lg:transition-colors lg:hover:bg-zinc-50/80 dark:lg:hover:bg-zinc-800/25"
                    >
                        <div className="min-w-0 w-full flex-1 sm:w-auto">
                            <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100 break-words line-clamp-3 sm:line-clamp-none sm:truncate">
                                {item.descripcion || 'Artículo'}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 break-words">
                                {[item.clave_vestuario || item.codigo, item.talla ? `Talla ${item.talla}` : null]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                            </p>
                        </div>
                        <span className="self-start shrink-0 rounded-md bg-zinc-100/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 sm:self-center">
                            ×{item.cantidad ?? 1}
                        </span>
                    </li>
                ))}
            </ul>
            {asignaciones.length > preview.length && (
                <Link
                    to={ROUTES.MI_VESTUARIO}
                    className="mt-5 block border-t border-zinc-100 pt-4 text-center text-sm font-medium text-brand-gold hover:opacity-90 dark:border-zinc-800/80 lg:text-left"
                >
                    Ver todo el vestuario
                </Link>
            )}
        </>
    );

    return (
        <div className={`mx-auto w-full min-w-0 pb-12 pt-0 ${layoutDosColumnas ? 'max-w-5xl' : 'max-w-md'}`}>
            {layoutDosColumnas ? (
                <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/50 to-brand-gold/[0.05] p-4 shadow-[0_2px_32px_-14px_rgba(0,0,0,0.12)] dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-950 dark:to-brand-gold/[0.04] sm:rounded-[1.75rem] sm:p-7 lg:p-9">
                    <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-0">
                        <div className="min-w-0 lg:col-span-5 lg:flex lg:min-h-[min(22rem,55vh)] lg:flex-col lg:justify-center lg:border-r lg:border-zinc-200/60 lg:pr-8 xl:pr-10 dark:lg:border-zinc-800/70">
                            <div className="min-w-0 lg:min-w-0">{bloqueSaludo}</div>
                        </div>
                        <div className="min-w-0 lg:col-span-7 lg:flex lg:min-h-[min(22rem,55vh)] lg:flex-col lg:pl-8 xl:pl-10">
                            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200/85 bg-white/95 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:border-zinc-800/90 dark:bg-zinc-900/65 dark:shadow-none sm:rounded-2xl sm:p-6">
                                {bloquePrendas}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-brand-gold/[0.06] to-white px-5 py-5 shadow-sm dark:border-zinc-800/90 dark:from-brand-gold/[0.05] dark:to-zinc-900/40">
                        {bloqueSaludo}
                    </div>
                    <div className="mt-5">
                        {!empleado ? (
                            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
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
                        ) : null}
                    </div>
                </>
            )}
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
