import { useState, useEffect } from 'react';
import { Plus, ToggleLeft } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, StatusBadge, Modal, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const EMPTY_FORM = { name: '', rfc: '', email: '', password: '', activo: true, roles: [] };

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-[13px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
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

export default function UsuariosPage() {
    // ── Paginación server-side ──────────────────────────────────────────
    const { data: users, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/usuarios', { perPage: 15 });

    // ── Roles para el modal (carga una sola vez) ────────────────────────
    const [roles, setRoles]       = useState([]);
    useEffect(() => {
        api.get('/api/roles?all=1').then((r) => setRoles(r.data ?? [])).catch(() => {});
    }, []);

    // ── Estado del modal CRUD ───────────────────────────────────────────
    const [saving, setSaving]     = useState(false);
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [confirm, setConfirm]   = useState(null);

    const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModal('create'); };
    const openEdit   = (row) => {
        setForm({
            name:     row.name ?? '',
            rfc:      row.rfc ?? '',
            email:    row.email ?? '',
            password: '',
            activo:   row.activo,
            roles:    row.roles?.map(Number) ?? [],
        });
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
            if (modal === 'create') await api.post('/api/usuarios', form);
            else await api.put(`/api/usuarios/${selected.id}`, form);
            closeModal();
            reload();
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            else setErrors({ general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/usuarios/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleToggle = async (row) => {
        try {
            await api.patch(`/api/usuarios/${row.id}/toggle-activo`);
            reload();
        } catch (e) { console.error(e); }
    };

    const toggleRole = (id) =>
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(id) ? prev.roles.filter((r) => r !== id) : [...prev.roles, id],
        }));

    // ── Columnas ────────────────────────────────────────────────────────
    const columns = [
        {
            key: 'name',
            label: 'Usuario',
            render: (val, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide leading-none">{val ?? '—'}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-mono leading-none">{row.rfc}</p>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Correo',
            render: (val) => <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{val ?? '—'}</span>,
        },
        {
            key: 'roles_names',
            label: 'Roles',
            render: (val) => (
                <div className="flex flex-wrap gap-1">
                    {val?.length
                        ? val.map((r) => (
                            <span key={r} className="px-2 py-0.5 rounded-lg bg-[#AF9460]/10 text-[#AF9460] text-[11px] font-bold uppercase tracking-wider border border-[#AF9460]/20">{r}</span>
                        ))
                        : <span className="text-[11px] text-zinc-400">—</span>
                    }
                </div>
            ),
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (val) => <StatusBadge status={val ? 'activo' : 'inactivo'} />,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Usuarios"
                description="Gestión de cuentas de acceso al sistema."
            />
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-stretch gap-3 mb-8">
                <input
                    type="text"
                    placeholder="Buscar por nombre, RFC o correo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2.5 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 transition-all"
                />
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                    <Plus size={13} strokeWidth={2.5} />
                    Nuevo Usuario
                </button>
            </div>

            <Card title={`Usuarios${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    onEdit={openEdit}
                    onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay usuarios registrados.'}
                    extraActions={[{
                        label: 'Activar / Desactivar',
                        icon: <ToggleLeft size={14} />,
                        onClick: handleToggle,
                        variant: 'success',
                    }]}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            {/* Modal */}
            <Modal open={!!modal} onClose={closeModal}
                title={modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'} size="md"
                footer={
                    <>
                        <button type="button" onClick={closeModal} disabled={saving}
                            className="px-4 py-2 rounded-xl text-[14px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" form="user-form" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold disabled:opacity-60 hover:opacity-90 transition-all">
                            {saving && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {modal === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                        </button>
                    </>
                }
            >
                <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{errors.general}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Field label="Nombre Completo" error={errors.name?.[0]}>
                                <Inp value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Juan Pérez Ramos" required />
                            </Field>
                        </div>
                        <Field label="RFC" error={errors.rfc?.[0]}>
                            <Inp value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} placeholder="PERJ880214XYZ" maxLength={20} required />
                        </Field>
                        <Field label="Correo Electrónico" error={errors.email?.[0]}>
                            <Inp type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@dominio.com" />
                        </Field>
                        <div className="col-span-2">
                            <Field label={modal === 'edit' ? 'Contraseña (vacío = sin cambio)' : 'Contraseña'} error={errors.password?.[0]}>
                                <Inp type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" required={modal === 'create'} />
                            </Field>
                        </div>
                    </div>

                    <Field label="Roles" error={errors.roles?.[0]}>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {roles.map((role) => (
                                <label key={role.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    form.roles.includes(role.id)
                                        ? 'border-[#AF9460]/40 bg-[#AF9460]/8 text-[#AF9460]'
                                        : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
                                }`}>
                                    <input type="checkbox" className="hidden" checked={form.roles.includes(role.id)} onChange={() => toggleRole(role.id)} />
                                    <span className={`size-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                        form.roles.includes(role.id) ? 'bg-[#AF9460] border-[#AF9460]' : 'border-zinc-300 dark:border-zinc-600'
                                    }`}>
                                        {form.roles.includes(role.id) && (
                                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        )}
                                    </span>
                                    <span className="text-[14px] font-semibold">{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </Field>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all">
                        <span className="text-[14px] font-semibold text-zinc-600 dark:text-zinc-400">Usuario activo</span>
                        <div onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                            className={`relative w-9 h-5 rounded-full transition-colors ${form.activo ? 'bg-[#AF9460]' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${form.activo ? 'left-4' : 'left-0.5'}`} />
                        </div>
                    </label>
                </form>
            </Modal>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Usuario"
                message={`¿Estás seguro de eliminar a "${confirm?.name}"? Se eliminarán sus roles asignados.`}
            />
        </div>
    );
}
