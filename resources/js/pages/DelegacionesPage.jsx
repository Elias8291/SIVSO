import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Modal } from '../components/ui';
import { api } from '../lib/api';

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

function FormModal({ item, onClose, onSaved }) {
    const isEdit = !!item?.id;
    const [form, setForm] = useState({ clave: '', nombre: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) setForm({ clave: item.clave ?? '', nombre: item.nombre ?? '' });
        else setForm({ clave: '', nombre: '' });
        setErrors({});
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) await api.put(`/api/delegaciones/${item.id}`, form);
            else await api.post('/api/delegaciones', form);
            onSaved();
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally { setSaving(false); }
    };

    return (
        <Modal open={!!item || item === 'new'} onClose={onClose} title={isEdit ? 'Editar Delegación' : 'Nueva Delegación'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{errors.general}</p>}
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Clave</label>
                    <input type="text" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value.toUpperCase() })}
                        placeholder="Ej. 3B-101" maxLength={20} required className={inputClass} />
                    {errors.clave && <p className="text-[11px] text-red-500">{errors.clave[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nombre (opcional)</label>
                    <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        placeholder="Nombre descriptivo" className={inputClass} />
                </div>
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

export default function DelegacionesPage() {
    const { can } = useAuth();
    const canEdit = can('editar_delegaciones');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/delegaciones/all${q ? `?search=${encodeURIComponent(q)}` : ''}`)
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
        setSaving(true);
        try {
            await api.delete(`/api/delegaciones/${confirm.id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'clave',
            label: 'Clave',
            render: (v) => <span className="text-[13px] font-black text-brand-gold uppercase tracking-wider">{v}</span>,
        },
        {
            key: 'empleados_count',
            label: 'Empleados',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegaciones"
                description="Catálogo de delegaciones del sistema."
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => setEditing('new')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nueva Delegación
                            </button>
                            <button onClick={() => setEditing('new')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={<SearchInput placeholder="Buscar por clave o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            />

            <Card title={`Delegaciones (${data.length})`}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    onEdit={canEdit ? ((row) => setEditing(row)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin delegaciones registradas."
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
                title="Eliminar Delegación"
                message={`¿Eliminar delegación "${confirm?.clave}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
