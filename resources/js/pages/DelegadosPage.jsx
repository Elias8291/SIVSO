import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Modal } from '../components/ui';
import { api } from '../lib/api';

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";
const selectClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

function FormModal({ item, onClose, onSaved }) {
    const isEdit = !!item?.id;
    const [form, setForm] = useState({ nombre: '', delegacion_id: '' });
    const [delegaciones, setDelegaciones] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/api/delegaciones/all').then(r => setDelegaciones(r.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (item && item !== 'new') {
            setForm({ nombre: item.nombre ?? '' });
        } else {
            setForm({ nombre: '', delegacion_id: '' });
        }
        setErrors({});
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/delegados/${item.id}`, { nombre: form.nombre });
            } else {
                await api.post('/api/delegados', { nombre: form.nombre, delegacion_id: parseInt(form.delegacion_id, 10) });
            }
            onSaved();
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally { setSaving(false); }
    };

    return (
        <Modal open={!!item} onClose={onClose} title={isEdit ? 'Editar Delegado' : 'Nuevo Delegado'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{errors.general}</p>}
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nombre completo</label>
                    <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                        placeholder="Ej. JUAN PÉREZ LÓPEZ" maxLength={120} required className={inputClass} />
                    {errors.nombre && <p className="text-[11px] text-red-500">{errors.nombre[0]}</p>}
                </div>
                {!isEdit && (
                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Delegación asignada</label>
                        <select value={form.delegacion_id} onChange={(e) => setForm({ ...form, delegacion_id: e.target.value })}
                            required className={selectClass}>
                            <option value="">Seleccionar…</option>
                            {delegaciones.map(d => (
                                <option key={d.id} value={d.id}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                            ))}
                        </select>
                        {errors.delegacion_id && <p className="text-[11px] text-red-500">{errors.delegacion_id[0]}</p>}
                    </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                    <button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all">
                        {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function DelegadosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/delegados/resumen${q ? `?search=${encodeURIComponent(q)}` : ''}`)
            .then(r => setData(r.data ?? []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
    }, [search]);

    const handleDelete = async () => {
        if (!confirm?.delegaciones?.length) return;
        setSaving(true);
        try {
            await api.delete(`/api/delegados/${confirm.delegaciones[0].id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Nombre',
            render: (v) => <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{v}</p>,
        },
        {
            key: 'delegaciones_count',
            label: 'Delegaciones',
            render: (v) => <span className="text-[13px] text-zinc-500">{v}</span>,
        },
        {
            key: 'trabajadores_total',
            label: 'Trabajadores',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
        {
            key: 'delegaciones',
            label: 'Claves',
            render: (v) => (
                <div className="flex flex-wrap gap-1">
                    {(v ?? []).slice(0, 5).map((d, i) => (
                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold">{d.clave}</span>
                    ))}
                    {(v ?? []).length > 5 && <span className="text-[10px] text-zinc-400">+{v.length - 5}</span>}
                </div>
            ),
            hideOnMobile: true,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegados"
                description="Delegados y las delegaciones que representan."
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => setEditing('new')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nuevo Delegado
                            </button>
                            <button onClick={() => setEditing('new')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={<SearchInput placeholder="Buscar por nombre o clave..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            />

            <Card title={`Delegados (${data.length})`}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    onEdit={canEdit ? ((row) => {
                        if (row.delegaciones?.[0]) setEditing({ id: row.delegaciones[0].id, nombre: row.nombre });
                    }) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin delegados registrados."
                />
            </Card>

            <FormModal
                item={editing}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); load(); }}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Delegado"
                message={`¿Eliminar delegado "${confirm?.nombre}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
