import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Check, CheckCheck, Trash2, ListFilter, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../lib/useDebounce';
import {
    PageHeader,
    SearchInput,
    FilterToolbar,
    FilterToolbarRow,
    FilterSelectShell,
} from '../components/ui';

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

/** Misma línea que inputs del sistema: borde + foco oro */
const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-brand-gold/35 focus:ring-2 focus:ring-brand-gold/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export default function NotificacionesPage() {
    const { can } = useAuth();
    const puedeEnviar = can('enviar_notificaciones') || can('gestionar_usuarios');

    const [items, setItems] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todas');
    const [tipoFiltro, setTipoFiltro] = useState('');

    const [tituloEnvio, setTituloEnvio] = useState('');
    const [mensajeEnvio, setMensajeEnvio] = useState('');
    const [tipoEnvio, setTipoEnvio] = useState('info');
    const [enlaceEnvio, setEnlaceEnvio] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const debouncedUserQ = useDebounce(userSearch, 280);
    const [userHits, setUserHits] = useState([]);
    const [destinatarios, setDestinatarios] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [envioMsg, setEnvioMsg] = useState(null);
    const [envioErr, setEnvioErr] = useState(null);

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

    useEffect(() => {
        if (!puedeEnviar || !debouncedUserQ.trim()) {
            setUserHits([]);
            return;
        }
        let cancelled = false;
        api.get(`/api/usuarios?search=${encodeURIComponent(debouncedUserQ.trim())}&per_page=10`)
            .then((r) => {
                if (!cancelled) setUserHits(r.data ?? []);
            })
            .catch(() => { if (!cancelled) setUserHits([]); });
        return () => { cancelled = true; };
    }, [debouncedUserQ, puedeEnviar]);

    const agregarDestinatario = (u) => {
        if (!u?.id) return;
        setDestinatarios((prev) => (prev.some((d) => d.id === u.id) ? prev : [...prev, { id: u.id, name: u.name, rfc: u.rfc }]));
        setUserSearch('');
        setUserHits([]);
    };

    const quitarDestinatario = (id) => {
        setDestinatarios((prev) => prev.filter((d) => d.id !== id));
    };

    const enviarNotificacion = async (e) => {
        e.preventDefault();
        setEnvioMsg(null);
        setEnvioErr(null);
        if (!tituloEnvio.trim() || !mensajeEnvio.trim()) {
            setEnvioErr('Indique título y mensaje.');
            return;
        }
        if (destinatarios.length === 0) {
            setEnvioErr('Agregue al menos un destinatario.');
            return;
        }
        setEnviando(true);
        try {
            const res = await api.post('/api/notificaciones/enviar', {
                user_ids: destinatarios.map((d) => d.id),
                titulo: tituloEnvio.trim(),
                mensaje: mensajeEnvio.trim(),
                tipo: tipoEnvio,
                enlace: enlaceEnvio.trim() || null,
            });
            setEnvioMsg(res?.message ?? 'Enviado.');
            setTituloEnvio('');
            setMensajeEnvio('');
            setEnlaceEnvio('');
            setTipoEnvio('info');
            setDestinatarios([]);
        } catch (err) {
            setEnvioErr(err.message || 'No se pudo enviar.');
        } finally {
            setEnviando(false);
        }
    };

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

    const visibles = useMemo(() => {
        if (!tipoFiltro) return items;
        return items.filter((n) => (n.tipo || 'info') === tipoFiltro);
    }, [items, tipoFiltro]);

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                compact
                title="Notificaciones"
                description={noLeidas > 0 ? `${noLeidas} sin leer` : 'Avisos en el panel'}
                actions={
                    noLeidas > 0 ? (
                        <button
                            type="button"
                            onClick={marcarTodas}
                            className="text-[12px] font-semibold text-zinc-500 transition hover:text-brand-gold dark:text-zinc-400"
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCheck size={14} strokeWidth={2} aria-hidden />
                                Marcar todas
                            </span>
                        </button>
                    ) : null
                }
            />

            {puedeEnviar && (
                <details className="group mb-8 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="cursor-pointer list-none px-4 py-3 text-[12px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60">
                        <span className="flex items-center justify-between gap-2">
                            <span>Enviar aviso</span>
                            <span className="text-zinc-400 transition-transform group-open:rotate-180">▼</span>
                        </span>
                    </summary>
                    <form onSubmit={enviarNotificacion} className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
                        <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Título</label>
                            <input type="text" value={tituloEnvio} onChange={(e) => setTituloEnvio(e.target.value)} className={fieldClass} placeholder="Asunto" maxLength={255} />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Mensaje</label>
                            <textarea value={mensajeEnvio} onChange={(e) => setMensajeEnvio(e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="Texto…" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tipo</label>
                                <select value={tipoEnvio} onChange={(e) => setTipoEnvio(e.target.value)} className={fieldClass}>
                                    <option value="info">Información</option>
                                    <option value="exito">Éxito</option>
                                    <option value="advertencia">Advertencia</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Enlace (opc.)</label>
                                <input type="text" value={enlaceEnvio} onChange={(e) => setEnlaceEnvio(e.target.value)} className={fieldClass} placeholder="/dashboard/…" />
                            </div>
                        </div>
                        <div>
                            <SearchInput label="Destinatario" placeholder="Nombre, RFC o correo…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                            {userHits.length > 0 && (
                                <ul className="mt-1 max-h-36 overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                    {userHits.map((u) => (
                                        <li key={u.id}>
                                            <button
                                                type="button"
                                                onClick={() => agregarDestinatario(u)}
                                                className="w-full px-3 py-2 text-left text-[12px] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            >
                                                <span className="font-medium text-zinc-800 dark:text-zinc-100">{u.name}</span>
                                                <span className="ml-2 font-mono text-[11px] text-zinc-500">{u.rfc}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {destinatarios.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {destinatarios.map((d) => (
                                    <span
                                        key={d.id}
                                        className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                    >
                                        {d.name}
                                        <button type="button" onClick={() => quitarDestinatario(d.id)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" aria-label={`Quitar ${d.name}`}>
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {envioErr && <p className="text-[12px] text-red-600 dark:text-red-400">{envioErr}</p>}
                        {envioMsg && <p className="text-[12px] text-emerald-600 dark:text-emerald-400">{envioMsg}</p>}
                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={enviando}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:border-white dark:bg-white dark:text-zinc-900"
                            >
                                <Send size={14} strokeWidth={2} aria-hidden />
                                {enviando ? 'Enviando…' : 'Enviar'}
                            </button>
                        </div>
                    </form>
                </details>
            )}

            <FilterToolbar className="mb-6">
                <div
                    className="flex w-fit gap-0.5 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
                    role="group"
                    aria-label="Filtrar por lectura"
                >
                    {[
                        { key: 'todas', label: 'Todas' },
                        { key: 'no_leidas', label: 'Sin leer' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFiltro(f.key)}
                            className={`rounded-md px-3 py-2 text-[12px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/30 ${
                                filtro === f.key
                                    ? 'bg-zinc-100 text-brand-gold dark:bg-zinc-800'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <FilterToolbarRow>
                    <FilterSelectShell id="notif-tipo" label="Tipo" icon={ListFilter} className="min-w-0 sm:w-[11rem]">
                        <select
                            id="notif-tipo"
                            value={tipoFiltro}
                            onChange={(e) => setTipoFiltro(e.target.value)}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                        >
                            <option value="">Todos</option>
                            <option value="info">Información</option>
                            <option value="exito">Éxito</option>
                            <option value="advertencia">Advertencia</option>
                            <option value="error">Error</option>
                        </select>
                    </FilterSelectShell>
                </FilterToolbarRow>
            </FilterToolbar>

            {loading ? (
                <p className="py-14 text-center text-[13px] text-zinc-400">Cargando…</p>
            ) : visibles.length === 0 ? (
                <div className="py-14 text-center">
                    <Bell size={24} strokeWidth={1.25} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" aria-hidden />
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                        {filtro === 'no_leidas' ? 'No hay sin leer' : 'Sin avisos'}
                        {tipoFiltro && items.length > 0 ? ' con este tipo' : ''}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    {visibles.map((n) => {
                        const sinLeer = !n.leida_en;

                        return (
                            <li key={n.id} className="group">
                                <div className="flex gap-3 px-4 py-4 sm:px-5">
                                    <div
                                        className={`w-0.5 shrink-0 self-stretch rounded-full ${sinLeer ? 'bg-brand-gold' : 'bg-zinc-200 dark:bg-zinc-700'} min-h-[2.5rem]`}
                                        aria-hidden
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                            <h3 className={`text-[13px] leading-snug ${sinLeer ? 'font-semibold text-zinc-900 dark:text-zinc-50' : 'font-medium text-zinc-600 dark:text-zinc-400'}`}>
                                                {n.titulo}
                                            </h3>
                                            <time className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500" dateTime={n.created_at}>
                                                {tiempoRelativo(n.created_at)}
                                            </time>
                                        </div>
                                        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            {n.mensaje}
                                        </p>
                                        {n.enlace && (
                                            <a href={n.enlace} className="mt-2 inline-block text-[12px] font-medium text-brand-gold hover:underline">
                                                Abrir enlace
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-0.5 self-start">
                                        {sinLeer && (
                                            <button
                                                type="button"
                                                onClick={() => marcarLeida(n.id)}
                                                title="Marcar leída"
                                                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                            >
                                                <Check size={14} strokeWidth={2} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => eliminar(n.id)}
                                            title="Eliminar"
                                            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                                        >
                                            <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
