import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, X } from 'lucide-react';
import { api } from '../lib/api';

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

const emptyForm = { anio: new Date().getFullYear(), nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'pendiente', descripcion: '' };

export default function PeriodosPage() {
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/periodos');
            setPeriodos(res.data ?? []);
        } catch { setPeriodos([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openNew = () => {
        setForm(emptyForm);
        setErrors({});
        setModal('nuevo');
    };

    const openEdit = (p) => {
        setForm({
            anio: p.anio,
            nombre: p.nombre,
            fecha_inicio: p.fecha_inicio?.slice(0, 10) ?? '',
            fecha_fin: p.fecha_fin?.slice(0, 10) ?? '',
            estado: p.estado,
            descripcion: p.descripcion ?? '',
        });
        setErrors({});
        setModal(p.id);
    };

    const save = async () => {
        setSaving(true);
        setErrors({});
        try {
            if (modal === 'nuevo') {
                await api.post('/api/periodos', form);
            } else {
                await api.put(`/api/periodos/${modal}`, form);
            }
            setModal(null);
            load();
        } catch (err) {
            if (err.errors) setErrors(err.errors);
        } finally { setSaving(false); }
    };

    const toggleEstado = async (p, nuevoEstado) => {
        try {
            await api.patch(`/api/periodos/${p.id}/estado`, { estado: nuevoEstado });
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

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Periodos</h1>
                    <p className="text-sm text-zinc-400 mt-0.5">Configura los periodos de actualización del sistema.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                >
                    <Plus size={15} strokeWidth={2} /> Nuevo
                </button>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="py-20 text-center text-sm text-zinc-400">Cargando...</div>
            ) : periodos.length === 0 ? (
                <div className="py-20 text-center">
                    <Calendar size={32} strokeWidth={1.2} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <p className="text-sm font-medium text-zinc-400">No hay periodos configurados</p>
                    <p className="text-xs text-zinc-400 mt-1">Crea uno para habilitar la actualización de datos.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {periodos.map(p => {
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

                                    {/* Acciones */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {p.estado !== 'abierto' && (
                                            <button
                                                onClick={() => toggleEstado(p, 'abierto')}
                                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Abrir
                                            </button>
                                        )}
                                        {p.estado === 'abierto' && (
                                            <button
                                                onClick={() => toggleEstado(p, 'cerrado')}
                                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Cerrar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
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

            {/* Modal */}
            {modal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
                    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                                {modal === 'nuevo' ? 'Nuevo Periodo' : 'Editar Periodo'}
                            </h2>
                            <button onClick={() => setModal(null)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Año" error={errors.anio}>
                                    <input type="number" value={form.anio} onChange={e => set('anio', e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Estado" error={errors.estado}>
                                    <select value={form.estado} onChange={e => set('estado', e.target.value)} className={inputCls}>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="abierto">Abierto</option>
                                        <option value="cerrado">Cerrado</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Nombre" error={errors.nombre}>
                                <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Selección Vestuario 2025" className={inputCls} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fecha inicio" error={errors.fecha_inicio}>
                                    <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Fecha fin" error={errors.fecha_fin}>
                                    <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className={inputCls} />
                                </Field>
                            </div>
                            <Field label="Descripción (opcional)" error={errors.descripcion}>
                                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} placeholder="Notas sobre este periodo..." className={inputCls + ' resize-none'} />
                            </Field>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={save}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputCls = 'w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-800 dark:text-zinc-200 placeholder-zinc-400';

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500 mt-0.5">{Array.isArray(error) ? error[0] : error}</p>}
        </div>
    );
}
