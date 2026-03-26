import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ListFilter } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, PageAddButton, SearchInput, FilterSelectShell, FilterToolbar, FilterToolbarRow, Modal } from '../components/ui';

const ESTADO_LABEL = {
    abierto:   { text: 'Abierto',   dot: 'bg-zinc-800 dark:bg-zinc-200', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' },
    cerrado:   { text: 'Cerrado',   dot: 'bg-zinc-400 dark:bg-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' },
    pendiente: { text: 'Pendiente', dot: 'bg-zinc-400 dark:bg-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' },
};

const fmtFecha = (f) => {
    if (!f) return '—';
    const d = new Date(f.length === 10 ? f + 'T00:00:00' : f);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PeriodosPage() {
    const navigate = useNavigate();
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [abrirModal, setAbrirModal] = useState(null);
    const [notificarAlAbrir, setNotificarAlAbrir] = useState(true);
    const [feedback, setFeedback] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/periodos');
            setPeriodos(res.data ?? []);
        } catch { setPeriodos([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        return periodos.filter((p) => {
            if (estadoFiltro && p.estado !== estadoFiltro) return false;
            if (!q) return true;
            const blob = `${p.nombre ?? ''} ${p.anio ?? ''} ${p.descripcion ?? ''}`.toLowerCase();
            return blob.includes(q);
        });
    }, [periodos, search, estadoFiltro]);

    const toggleEstado = async (p, nuevoEstado) => {
        setFeedback(null);
        try {
            const r = await api.patch(`/api/periodos/${p.id}/estado`, { estado: nuevoEstado });
            if (r?.message) setFeedback(r.message);
            load();
        } catch { /* silently fail */ }
    };

    const solicitarAbrir = (p) => {
        setNotificarAlAbrir(true);
        setAbrirModal(p);
    };

    const confirmarAbrir = async () => {
        if (!abrirModal) return;
        setFeedback(null);
        try {
            const r = await api.patch(`/api/periodos/${abrirModal.id}/estado`, {
                estado: 'abierto',
                notificar: notificarAlAbrir,
            });
            setAbrirModal(null);
            if (r?.message) setFeedback(r.message);
            load();
        } catch { /* silently fail */ }
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este periodo?')) return;
        try {
            await api.delete(`/api/periodos/${id}`);
            load();
        } catch { /* silently fail */ }
    };

    return (
        <div>
            <PageHeader
                title="Periodos"
                description="Configura los periodos de actualización del sistema."
                actions={<PageAddButton onClick={() => navigate('/dashboard/periodos/nuevo')} label="Nuevo periodo" />}
            />

            {feedback && (
                <p className="mb-4 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400" role="status">
                    {feedback}
                </p>
            )}

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar periodo"
                    placeholder="Nombre, año o descripción…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FilterToolbarRow>
                    <FilterSelectShell id="periodos-estado" label="Estado" icon={ListFilter} className="min-w-0 sm:w-[11rem]">
                        <select
                            id="periodos-estado"
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                        >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="abierto">Abierto</option>
                            <option value="cerrado">Cerrado</option>
                        </select>
                    </FilterSelectShell>
                </FilterToolbarRow>
            </FilterToolbar>

            {loading ? (
                <div className="py-20 text-center text-sm text-zinc-400">Cargando...</div>
            ) : periodos.length === 0 ? (
                <div className="py-20 text-center">
                    <Calendar size={32} strokeWidth={1.2} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <p className="text-sm font-medium text-zinc-400">No hay periodos configurados</p>
                    <p className="text-xs text-zinc-400 mt-1">Crea uno para habilitar la actualización de datos.</p>
                </div>
            ) : filtrados.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Ningún periodo coincide con los filtros.
                </div>
            ) : (
                <div className="space-y-3">
                    {filtrados.map(p => {
                        const est = ESTADO_LABEL[p.estado] || ESTADO_LABEL.pendiente;
                        return (
                            <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{p.nombre}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${est.bg}`}>
                                                <span className={`size-1.5 rounded-full ${est.dot}`} />
                                                {est.text}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400">
                                            Año {p.anio} · {fmtFecha(p.fecha_inicio)} — {fmtFecha(p.fecha_fin)}
                                        </p>
                                        {p.descripcion && (
                                            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{p.descripcion}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                        {p.estado !== 'abierto' && (
                                            <button
                                                type="button"
                                                onClick={() => solicitarAbrir(p)}
                                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Abrir
                                            </button>
                                        )}
                                        {p.estado === 'abierto' && (
                                            <button
                                                type="button"
                                                onClick={() => toggleEstado(p, 'cerrado')}
                                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Cerrar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/dashboard/periodos/${p.id}/editar`)}
                                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => eliminar(p.id)}
                                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                open={!!abrirModal}
                onClose={() => setAbrirModal(null)}
                title="Abrir periodo"
                size="sm"
                footer={
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setAbrirModal(null)}
                            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmarAbrir}
                            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
                        >
                            Abrir periodo
                        </button>
                    </div>
                }
            >
                <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    El periodo quedará <strong className="font-semibold text-zinc-800 dark:text-zinc-200">abierto</strong> para que los usuarios puedan actualizar su vestuario según las fechas configuradas.
                </p>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded border-zinc-300 text-brand-gold focus:ring-brand-gold/30"
                        checked={notificarAlAbrir}
                        onChange={(e) => setNotificarAlAbrir(e.target.checked)}
                    />
                    <span className="text-[12px] leading-snug text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Enviar avisos en el panel</span>
                        {' '}(icono de campana) a <strong className="font-semibold text-zinc-800 dark:text-zinc-200">todos los empleados</strong> que tengan cuenta de usuario vinculada en el sistema (sin cuenta no se puede avisar en el panel).
                    </span>
                </label>
            </Modal>
        </div>
    );
}
