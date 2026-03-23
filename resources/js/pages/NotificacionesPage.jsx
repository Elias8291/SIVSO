import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CircleAlert, CircleCheck } from 'lucide-react';
import { api } from '../lib/api';

const TIPO_CONFIG = {
    info:         { icon: Info,           color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
    exito:        { icon: CircleCheck,    color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-500/10' },
    advertencia:  { icon: AlertTriangle,  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
    error:        { icon: CircleAlert,    color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10' },
};

function tiempoRelativo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const dias = Math.floor(hrs / 24);
    if (dias < 30) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function NotificacionesPage() {
    const [items, setItems] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todas');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = filtro === 'no_leidas' ? '/api/notificaciones?no_leidas=1' : '/api/notificaciones';
            const res = await api.get(url);
            setItems(res.data ?? []);
            setNoLeidas(res.no_leidas ?? 0);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => { load(); }, [load]);

    const marcarLeida = async (id) => {
        try {
            await api.patch(`/api/notificaciones/${id}/leida`);
            setItems(prev => prev.map(n => n.id === id ? { ...n, leida_en: new Date().toISOString() } : n));
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch { /* silently fail */ }
    };

    const marcarTodas = async () => {
        try {
            await api.post('/api/notificaciones/leer-todas');
            setItems(prev => prev.map(n => ({ ...n, leida_en: n.leida_en || new Date().toISOString() })));
            setNoLeidas(0);
        } catch { /* silently fail */ }
    };

    const eliminar = async (id) => {
        try {
            await api.delete(`/api/notificaciones/${id}`);
            setItems(prev => prev.filter(n => n.id !== id));
        } catch { /* silently fail */ }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Notificaciones</h1>
                    {noLeidas > 0 && (
                        <p className="text-sm text-zinc-400 mt-0.5">{noLeidas} sin leer</p>
                    )}
                </div>
                {noLeidas > 0 && (
                    <button
                        onClick={marcarTodas}
                        className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        <CheckCheck size={15} strokeWidth={2} />
                        Marcar todas
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="flex gap-1 mb-5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg w-fit">
                {[
                    { key: 'todas', label: 'Todas' },
                    { key: 'no_leidas', label: 'Sin leer' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFiltro(f.key)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            filtro === f.key
                                ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {loading ? (
                <div className="py-20 text-center text-sm text-zinc-400">Cargando...</div>
            ) : items.length === 0 ? (
                <div className="py-20 text-center">
                    <Bell size={32} strokeWidth={1.2} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <p className="text-sm font-medium text-zinc-400">
                        {filtro === 'no_leidas' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {items.map(n => {
                        const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
                        const Icon = cfg.icon;
                        const sinLeer = !n.leida_en;

                        return (
                            <div
                                key={n.id}
                                className={`group relative flex gap-3 p-3.5 rounded-xl transition-colors ${
                                    sinLeer
                                        ? 'bg-white dark:bg-zinc-800/80 border border-zinc-150 dark:border-zinc-700/60'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                }`}
                            >
                                {/* Icono */}
                                <div className={`shrink-0 size-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                                    <Icon size={15} strokeWidth={2} className={cfg.color} />
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm leading-snug ${sinLeer ? 'font-semibold text-zinc-800 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {n.titulo}
                                        </p>
                                        <span className="text-xs text-zinc-400 shrink-0 pt-0.5">{tiempoRelativo(n.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.mensaje}</p>

                                    {n.enlace && (
                                        <a
                                            href={n.enlace}
                                            className="inline-block text-sm font-medium text-brand-gold hover:underline mt-1.5"
                                        >
                                            Ver detalle
                                        </a>
                                    )}
                                </div>

                                {/* Acciones hover */}
                                <div className="absolute top-3 right-3 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {sinLeer && (
                                        <button
                                            onClick={() => marcarLeida(n.id)}
                                            title="Marcar como leída"
                                            className="p-1.5 rounded-md text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                        >
                                            <Check size={14} strokeWidth={2} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => eliminar(n.id)}
                                        title="Eliminar"
                                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>

                                {/* Punto indicador sin leer */}
                                {sinLeer && (
                                    <span className="absolute top-4 left-1.5 size-1.5 rounded-full bg-brand-gold" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
