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

function MiniPrendaRow({ item }) {
    return (
        <div className="flex items-center gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
            <div className="size-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                <Shirt size={16} strokeWidth={2} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {item.descripcion || 'Artículo'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 flex gap-2">
                    <span>{item.clave_vestuario || item.codigo || '—'}</span>
                    {item.talla && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-600">|</span>
                            <span>Talla {item.talla}</span>
                        </>
                    )}
                </p>
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
                {item.cantidad ?? 1} pza
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-28">
                <span className="size-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Encabezado minimalista */}
            <header className="mb-2">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Hola, {empleado?.nombre || user?.name || 'Colaborador'}
                </h1>
                {empleado?.dependencia_clave && (
                    <p className="text-sm text-zinc-500 mt-1">
                        {empleado.dependencia_clave}
                        {empleado.delegacion_clave ? ` — Delegación ${empleado.delegacion_clave}` : ''}
                    </p>
                )}
            </header>

            {/* Periodo */}
            {periodo && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <Calendar size={16} className="text-zinc-400 shrink-0" strokeWidth={2} />
                    <div className="flex-1">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                            Periodo activo: <span className="font-medium">{periodo.nombre}</span>
                        </p>
                    </div>
                    {periodo.fecha_fin && (
                        <div className="text-xs text-zinc-500">
                            Hasta {periodo.fecha_fin}
                        </div>
                    )}
                </div>
            )}

            {/* CTA principal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                        Mi vestuario
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1 max-w-md">
                        Consulte sus prendas asignadas, ajuste tallas o cambie de artículo según el periodo actual.
                    </p>
                </div>
                <Link
                    to={ROUTES.MI_VESTUARIO}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shrink-0"
                >
                    Gestionar vestuario
                </Link>
            </div>

            {/* Resumen prendas */}
            {!empleado ? (
                <div className="p-6 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Aún no hay vestuario vinculado
                    </p>
                    <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                        Vincule su NUE en <Link to={ROUTES.MI_CUENTA} className="text-zinc-800 dark:text-zinc-200 font-medium underline underline-offset-2 hover:text-zinc-600">Mi cuenta</Link> para ver sus asignaciones.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/20">
                        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {totalPiezas ? `Sus prendas (${totalPiezas})` : 'Sus prendas'}
                        </h3>
                    </div>
                    <div className="px-5">
                        {preview.length === 0 ? (
                            <p className="text-sm text-zinc-500 text-center py-8">
                                No hay artículos en su vestuario para el ejercicio mostrado.
                            </p>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {preview.map((item) => (
                                    <MiniPrendaRow key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                        {asignaciones.length > 5 && (
                            <div className="py-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                <Link
                                    to={ROUTES.MI_VESTUARIO}
                                    className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    Ver todo el vestuario →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
