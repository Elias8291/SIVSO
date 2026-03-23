import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users,
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

function MiniPrendaRow({ item }) {
    const meta = [
        item.clave_vestuario || item.codigo || null,
        item.talla ? `Talla ${item.talla}` : null,
    ].filter(Boolean);

    return (
        <div className="flex items-baseline justify-between gap-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
            <div className="min-w-0 flex-1">
                <p className="text-[14px] text-zinc-800 dark:text-zinc-100 leading-snug">
                    {item.descripcion || 'Artículo'}
                </p>
                {meta.length > 0 && (
                    <p className="text-[12px] text-zinc-500 mt-1">
                        {meta.join(', ')}
                    </p>
                )}
            </div>
            <span className="text-[13px] text-zinc-500 tabular-nums shrink-0">
                ×{item.cantidad ?? 1}
            </span>
        </div>
    );
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

    const nombreMostrar = empleado?.nombre || user?.name || 'Colaborador';
    const lineaUbicacion = [
        empleado?.dependencia_clave,
        empleado?.delegacion_clave ? `Delegación ${empleado.delegacion_clave}` : null,
    ].filter(Boolean);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-28">
                <span className="size-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-500 dark:border-t-zinc-400 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-10">
            <header className="space-y-3">
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                    Hola,
                </p>
                <h1 className="text-[26px] sm:text-[28px] font-medium text-zinc-900 dark:text-white tracking-tight leading-tight">
                    {nombreMostrar}
                </h1>
                {lineaUbicacion.length > 0 && (
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {lineaUbicacion.join(', ')}
                    </p>
                )}
            </header>

            {periodo && (
                <div className="pl-4 border-l border-zinc-200 dark:border-zinc-700">
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mb-1">
                        Periodo de actualización
                    </p>
                    <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-snug">
                        {periodo.nombre}
                        {periodo.fecha_fin ? (
                            <span className="text-zinc-500">
                                {`, vigente hasta ${periodo.fecha_fin}`}
                            </span>
                        ) : null}
                    </p>
                </div>
            )}

            <section className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 px-5 py-6 sm:px-7 sm:py-7">
                <h2 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                    Mi vestuario
                </h2>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Aquí puede revisar lo asignado y, cuando el periodo lo permita, ajustar tallas o cambiar artículo.
                </p>
                <Link
                    to={ROUTES.MI_VESTUARIO}
                    className="inline-flex mt-5 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2.5 hover:bg-white dark:hover:bg-zinc-800/80 transition-colors"
                >
                    Ir a mi vestuario
                </Link>
            </section>

            {!empleado ? (
                <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 px-5 py-8 text-center">
                    <p className="text-[14px] text-zinc-700 dark:text-zinc-300">
                        Aún no hay vestuario vinculado a su cuenta.
                    </p>
                    <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed">
                        Indique su NUE en{' '}
                        <Link to={ROUTES.MI_CUENTA} className="font-medium text-zinc-800 dark:text-zinc-200 underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-brand-gold">
                            Mi cuenta
                        </Link>
                        {' '}para ver sus asignaciones.
                    </p>
                </div>
            ) : (
                <Card title={totalPiezas ? `Prendas asignadas (${totalPiezas} piezas)` : 'Prendas asignadas'}>
                    <div className="px-5 sm:px-6 pb-6">
                        {preview.length === 0 ? (
                            <p className="text-[13px] text-zinc-500 text-center py-10">
                                No hay artículos en su vestuario en este ejercicio.
                            </p>
                        ) : (
                            <div>
                                {preview.map((item) => (
                                    <MiniPrendaRow key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                        {asignaciones.length > 5 && (
                            <div className="pt-5 mt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                                <Link
                                    to={ROUTES.MI_VESTUARIO}
                                    className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600"
                                >
                                    Ver listado completo
                                </Link>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <p className="text-[11px] text-zinc-400 text-center pt-2">
                Sistema Integral de Vestuario
            </p>
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
