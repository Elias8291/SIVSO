import { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, Modal, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const EMPTY_FORM = { name: '', guard_name: 'web', permissions: [] };

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function Inp({ ...props }) {
    return (
        <input
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/50 transition-all"
            {...props}
        />
    );
}

function groupPermisos(permisos) {
    return permisos.reduce((acc, p) => {
        const [module] = p.name.split('.');
        if (!acc[module]) acc[module] = [];
        acc[module].push(p);
        return acc;
    }, {});
}

export default function RolesPage() {
    // permisos viene en el primer response junto con la primera página (se cachea en extra)
    const { data: roles, meta, extra, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/roles', { perPage: 15, extraData: ['permisos'] });

    const permisos = extra.permisos ?? [];

    const [saving, setSaving]     = useState(false);
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [confirm, setConfirm]   = useState(null);

    const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModal('create'); };
    const openEdit   = (row) => {
        setForm({ name: row.name, guard_name: row.guard_name, permissions: row.permissions?.map(Number) ?? [] });
        setErrors({});
        setSelected(row);
        setModal('edit');
    };
    const closeModal = () => { setModal(null); setSelected(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (modal === 'create') await api.post('/api/roles', form);
            else await api.put(`/api/roles/${selected.id}`, form);
            closeModal();
            reload();
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            else setErrors({ general: err.message });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/roles/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const togglePermiso = (id) =>
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter((p) => p !== id)
                : [...prev.permissions, id],
        }));

    const toggleModulo = (modPermisos) => {
        const ids = modPermisos.map((p) => p.id);
        const allSelected = ids.every((id) => form.permissions.includes(id));
        setForm((prev) => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter((p) => !ids.includes(p))
                : [...new Set([...prev.permissions, ...ids])],
        }));
    };

    const groups = groupPermisos(permisos);

    const columns = [
        {
            key: 'name',
            label: 'Rol',
            render: (val) => (
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                        <Shield size={13} className="text-[#AF9460]" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">{val}</span>
                </div>
            ),
        },
        {
            key: 'guard_name',
            label: 'Guard',
            render: (val) => (
                <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[10px] font-mono border border-zinc-100 dark:border-zinc-700">{val}</span>
            ),
        },
        {
            key: 'permisos_count',
            label: 'Permisos',
            render: (val) => <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{val}</span>,
        },
        {
            key: 'users_count',
            label: 'Usuarios',
            render: (val) => <span className="text-[11px] text-zinc-500">{val}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Roles"
                description="Grupos de permisos asignables a usuarios del sistema."
                actions={
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        <Plus size={13} strokeWidth={2.5} /> Nuevo Rol
                    </button>
                }
                search={
                    <SearchInput
                        placeholder="Buscar rol..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            <Card title={`Roles${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable columns={columns} data={roles} loading={loading}
                    onEdit={openEdit} onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay roles registrados.'}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            {/* Modal */}
            <Modal open={!!modal} onClose={closeModal}
                title={modal === 'create' ? 'Nuevo Rol' : 'Editar Rol'} size="lg"
                footer={
                    <>
                        <button type="button" onClick={closeModal} disabled={saving}
                            className="px-4 py-2 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" form="role-form" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold disabled:opacity-60 hover:opacity-90 transition-all">
                            {saving && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {modal === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
                        </button>
                    </>
                }
            >
                <form id="role-form" onSubmit={handleSubmit} className="space-y-5">
                    {errors.general && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{errors.general}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <Field label="Nombre del Rol" error={errors.name?.[0]}>
                                <Inp value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. editor, supervisor" required />
                            </Field>
                        </div>
                        <Field label="Guard" error={errors.guard_name?.[0]}>
                            <Inp value={form.guard_name} onChange={(e) => setForm({ ...form, guard_name: e.target.value })} placeholder="web" />
                        </Field>
                    </div>

                    <Field label={`Permisos (${form.permissions.length} seleccionados)`} error={errors.permissions?.[0]}>
                        <div className="space-y-2 mt-1 max-h-72 overflow-y-auto pr-1">
                            {Object.entries(groups).map(([module, modPermisos]) => {
                                const allSelected  = modPermisos.every((p) => form.permissions.includes(p.id));
                                const someSelected = modPermisos.some((p) => form.permissions.includes(p.id));
                                return (
                                    <div key={module} className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                        <button type="button" onClick={() => toggleModulo(modPermisos)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 capitalize">{module}</span>
                                            <span className={`size-4 rounded border-2 flex items-center justify-center transition-all ${
                                                allSelected ? 'bg-[#AF9460] border-[#AF9460]'
                                                : someSelected ? 'border-[#AF9460]' : 'border-zinc-300 dark:border-zinc-600'
                                            }`}>
                                                {allSelected && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                {someSelected && !allSelected && <span className="size-1.5 rounded-sm bg-[#AF9460] block" />}
                                            </span>
                                        </button>
                                        <div className="grid grid-cols-2 gap-1 p-2">
                                            {modPermisos.map((p) => (
                                                <label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-[10px] font-medium ${
                                                    form.permissions.includes(p.id)
                                                        ? 'bg-[#AF9460]/8 text-[#AF9460] border border-[#AF9460]/20'
                                                        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent'
                                                }`}>
                                                    <input type="checkbox" className="hidden" checked={form.permissions.includes(p.id)} onChange={() => togglePermiso(p.id)} />
                                                    <span className={`size-3.5 rounded border flex items-center justify-center shrink-0 ${
                                                        form.permissions.includes(p.id) ? 'bg-[#AF9460] border-[#AF9460]' : 'border-zinc-300 dark:border-zinc-600'
                                                    }`}>
                                                        {form.permissions.includes(p.id) && <svg width="7" height="7" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </span>
                                                    {p.name.split('.')[1]}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {permisos.length === 0 && (
                                <p className="text-xs text-zinc-400 text-center py-4">No hay permisos registrados aún.</p>
                            )}
                        </div>
                    </Field>
                </form>
            </Modal>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Rol"
                message={`¿Eliminar el rol "${confirm?.name}"? Los usuarios que lo tengan asignado lo perderán.`}
            />
        </div>
    );
}
