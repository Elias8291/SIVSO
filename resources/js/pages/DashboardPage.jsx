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
        <div className="flex items-center gap-4 py-3 border-b border-zinc-100/80 dark:border-zinc-800/80 last:border-0">
            <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                <Shirt size={18} strokeWidth={1.5} className="text-brand-gold/90" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-2">
                    {item.descripcion || 'Artículo'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-mono tracking-wide">
                    {item.clave_vestuario || item.codigo || '—'}
                    {item.talla ? (
                        <span className="text-zinc-400"> · Talla {item.talla}</span>
                    ) : null}
                </p>
            </div>
            <span className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-28">
                <span className="size-7 border-2 border-zinc-200 dark:border-zinc-700 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Encabezado formal */}
            <header className="text-center sm:text-left border-b border-zinc-200/80 dark:border-zinc-800/80 pb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-400 mb-2">
                    Bienvenido
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                    {empleado?.nombre || user?.name || 'Colaborador'}
                </h1>
                {empleado?.dependencia_clave && (
                    <p className="text-[13px] text-zinc-500 mt-2 font-medium">
                        {empleado.dependencia_clave}
                        {empleado.delegacion_clave ? (
                            <span className="text-zinc-400"> · Delegación {empleado.delegacion_clave}</span>
                        ) : null}
                    </p>
                )}
            </header>

            {/* Periodo */}
            {periodo && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-brand-gold/[0.06] dark:bg-brand-gold/[0.08] border border-brand-gold/20">
                    <Calendar size={18} className="text-brand-gold shrink-0 mt-0.5" strokeWidth={1.8} />
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold/90">
                            Periodo de actualización
                        </p>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 mt-0.5">
                            {periodo.nombre}
                            {periodo.fecha_fin ? (
                                <span className="text-zinc-500"> — vigente hasta {periodo.fecha_fin}</span>
                            ) : null}
                        </p>
                    </div>
                </div>
            )}

            {/* CTA principal */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-6 py-8 sm:px-10 sm:py-10 shadow-sm">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-gold/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                            <Sparkles size={14} className="text-brand-gold" strokeWidth={2} />
                            Mi vestuario
                        </div>
                        <p className="text-[15px] sm:text-[16px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                            Consulte sus prendas asignadas, ajuste tallas o cambie de artículo cuando el periodo lo permita.
                        </p>
                    </div>
                    <Link
                        to={ROUTES.MI_VESTUARIO}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shrink-0 shadow-lg shadow-zinc-900/10"
                    >
                        Gestionar vestuario
                        <ArrowRight size={16} strokeWidth={2.2} />
                    </Link>
                </div>
            </div>

            {/* Resumen prendas */}
            {!empleado ? (
                <Card className="px-6 py-10">
                    <div className="text-center">
                        <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">
                            Aún no hay vestuario vinculado
                        </p>
                        <p className="text-[12px] text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
                            Vincule su NUE en <Link to={ROUTES.MI_CUENTA} className="text-brand-gold font-semibold hover:underline">Mi cuenta</Link>
                            {' '}para ver sus asignaciones.
                        </p>
                    </div>
                </Card>
            ) : (
                <Card title={totalPiezas ? `Sus prendas (${totalPiezas} piezas)` : 'Sus prendas'}>
                    <div className="px-6 pb-6">
                        {preview.length === 0 ? (
                            <p className="text-[13px] text-zinc-500 text-center py-8">
                                No hay artículos en su vestuario para el ejercicio mostrado.
                            </p>
                        ) : (
                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                                {preview.map((item) => (
                                    <MiniPrendaRow key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                        {asignaciones.length > 5 && (
                            <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                <Link
                                    to={ROUTES.MI_VESTUARIO}
                                    className="text-[12px] font-bold text-brand-gold hover:underline inline-flex items-center gap-1"
                                >
                                    Ver todo el vestuario
                                    <ArrowRight size={12} strokeWidth={2.5} />
                                </Link>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <p className="text-center text-[11px] text-zinc-400 font-medium">
                Sistema Integral de Vestuario — uso exclusivo institucional
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
