import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, Clock, CheckCircle, Users, Shirt, ArrowRight, Calendar, Sparkles, AlertCircle, Info
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
    const preview = asignaciones.slice(0, 4); // Solo mostramos 4 como resumen
    const totalPiezas = asignaciones.reduce((acc, a) => acc + (Number(a.cantidad) || 0), 0);
    const periodo = data?.periodo_activo;

    if (loading) {
        return (
            <div className="flex items-center justify-start py-20 pl-4 sm:pl-8">
                <div className="flex flex-col items-start gap-4">
                    <span className="size-6 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cargando panel...</span>
                </div>
            </div>
        );
    }

    if (!empleado) {
        return (
            <div className="w-full max-w-4xl space-y-6 pb-12">
                <header className="pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Resumen de Asignación
                    </h1>
                </header>
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <AlertCircle size={24} className="text-zinc-400 mb-3" />
                    <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        Sin vinculación
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                        Para ver su panel de vestuario, es necesario vincular su número de empleado (NUE).
                    </p>
                    <Link 
                        to={ROUTES.MI_CUENTA} 
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
                    >
                        Ir a Mi cuenta
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl space-y-8 pb-12">
            {/* Cabecera del Dashboard */}
            <header className="pb-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Panel de Colaborador
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-2">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{empleado.nombre || user?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                        <span>{empleado.dependencia_clave}</span>
                    </p>
                </div>
                <Link
                    to={ROUTES.MI_VESTUARIO}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors shrink-0 shadow-sm"
                >
                    Gestionar vestuario
                    <ArrowRight size={16} />
                </Link>
            </header>

            {/* KPIs / Tarjetas de Resumen (El verdadero "Dashboard") */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {/* KPI 1: Total Asignado */}
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <Shirt size={16} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Asignado</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{totalPiezas}</span>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-500">prendas</span>
                    </div>
                </div>

                {/* KPI 2: Periodo */}
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <Calendar size={16} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Periodo Vigente</h3>
                    </div>
                    <div>
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {periodo?.nombre || 'No activo'}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-0.5">
                            {periodo?.fecha_fin ? `Cierre: ${periodo.fecha_fin}` : '--'}
                        </p>
                    </div>
                </div>

                {/* KPI 3: Estado */}
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <Info size={16} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Estado General</h3>
                    </div>
                    <div>
                        <p className="text-lg font-medium text-emerald-600 dark:text-emerald-500 truncate flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Asignación lista
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-0.5">
                            Revise y confirme tallas
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenido Dividido: Instrucciones y Lista de Previsualización */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                
                {/* Columna Izquierda: Información */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/50">
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-widest">
                            Instrucciones
                        </h3>
                        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <p>
                                Bienvenido a su panel de resumen. Desde aquí puede monitorear el estado de su asignación de vestuario para el periodo actual.
                            </p>
                            <p>
                                Es importante que verifique que las prendas listadas correspondan a su perfil y que las <strong className="text-zinc-900 dark:text-zinc-200 font-medium">tallas</strong> sean correctas antes de la fecha de cierre.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Previsualización en Lista (No Grid) */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                            Vista previa de prendas
                        </h3>
                        {asignaciones.length > 4 && (
                            <Link to={ROUTES.MI_VESTUARIO} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                Ver todas ({asignaciones.length}) &rarr;
                            </Link>
                        )}
                    </div>
                    
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                        {preview.length === 0 ? (
                            <div className="p-10 text-center text-sm text-zinc-500">
                                No hay prendas asignadas en este momento.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {preview.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                                <Shirt size={16} strokeWidth={2} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {item.descripcion || 'Artículo'}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono tracking-wide">
                                                    {item.clave_vestuario || item.codigo || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {item.talla ? `Talla ${item.talla}` : 'Sin talla'}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                {item.cantidad} pza{item.cantidad > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
