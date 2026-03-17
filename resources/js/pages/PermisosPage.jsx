import { useState, useEffect } from 'react';
import { Plus, Lock } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, Modal, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const EMPTY_FORM = { name: '', guard_name: 'web' };

const SUGGESTED_MODULES = [
    'usuarios', 'roles', 'permisos', 'empleados',
    'inventario', 'solicitudes', 'asignaciones', 'reportes',
];
const SUGGESTED_ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'exportar'];

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

export default function PermisosPage() {
    const { data: permisos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/permisos', { perPage: 20 });

    // Módulos únicos (para los chips de resumen) — se calculan del total en backend vía búsqueda vacía
    const [allModules, setAllModules] = useState({});
    useEffect(() => {
        api.get('/api/permisos?all=1')
            .then((r) => {
                const groups = (r.data ?? []).reduce((acc, p) => {
                    const [mod] = p.name.split('.');
                    acc[mod] = (acc[mod] ?? 0) + 1;
                    return acc;
                }, {});
                setAllModules(groups);
            })
            .catch(() => {});
    }, []);

    const [saving, setSaving]     = useState(false);
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [confirm, setConfirm]   = useState(null);
    const [module, setModule]     = useState('');
    const [action, setAction]     = useState('');

    // Generador rápido
    useEffect(() => {
        if (module && action) setForm((p) => ({ ...p, name: `${module}.${action}` }));
    }, [module, action]);

    const openCreate = () => { setForm(EMPTY_FORM); setModule(''); setAction(''); setErrors({}); setSelected(null); setModal('create'); };
    const openEdit   = (row) => { setForm({ name: row.name, guard_name: row.guard_name }); setErrors({}); setSelected(row); setModal('edit'); };
    const closeModal = () => { setModal(null); setSelected(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (modal === 'create') await api.post('/api/permisos', form);
            else await api.put(`/api/permisos/${selected.id}`, form);
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
            await api.delete(`/api/permisos/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'name',
            label: 'Permiso',
            render: (val) => {
                const [mod, act] = val.split('.');
                return (
                    <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                            <Lock size={12} className="text-zinc-400" strokeWidth={2} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">{val}</span>
                            {mod && act && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-px rounded bg-[#AF9460]/10 text-[#AF9460] text-[8px] font-bold uppercase">{mod}</span>
                                    <span className="text-[8px] text-zinc-400">{act}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'guard_name',
            label: 'Guard',
            render: (val) => (
                <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[10px] font-mono border border-zinc-100 dark:border-zinc-700">{val}</span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Permisos"
                description="Control granular de acciones disponibles en el sistema."
                actions={
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        <Plus size={13} strokeWidth={2.5} /> Nuevo Permiso
                    </button>
                }
                search={
                    <SearchInput
                        placeholder="Buscar permiso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            {/* Chips resumen por módulo */}
            {Object.keys(allModules).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(allModules).map(([mod, count]) => (
                        <button key={mod} onClick={() => setSearch(mod)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                                search === mod
                                    ? 'bg-[#AF9460] border-[#AF9460] text-white'
                                    : 'bg-white dark:bg-zinc-800/60 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-[#AF9460]/40'
                            }`}>
                            {mod}
                            <span className={`size-4 rounded-md text-[9px] font-black flex items-center justify-center ${
                                search === mod ? 'bg-white/20 text-white' : 'bg-[#AF9460]/10 text-[#AF9460]'
                            }`}>{count}</span>
                        </button>
                    ))}
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[9px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all">
                            × Limpiar
                        </button>
                    )}
                </div>
            )}

            <Card title={`Permisos${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable columns={columns} data={permisos} loading={loading}
                    onEdit={openEdit} onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay permisos registrados.'}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            {/* Modal */}
            <Modal open={!!modal} onClose={closeModal}
                title={modal === 'create' ? 'Nuevo Permiso' : 'Editar Permiso'} size="sm"
                footer={
                    <>
                        <button type="button" onClick={closeModal} disabled={saving}
                            className="px-4 py-2 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" form="permiso-form" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold disabled:opacity-60 hover:opacity-90 transition-all">
                            {saving && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {modal === 'create' ? 'Crear Permiso' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <form id="permiso-form" onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{errors.general}</p>
                    )}

                    {modal === 'create' && (
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Generador Rápido</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[9px] text-zinc-400 mb-1 uppercase tracking-wider font-medium">Módulo</p>
                                    <div className="flex flex-wrap gap-1">
                                        {SUGGESTED_MODULES.map((m) => (
                                            <button key={m} type="button" onClick={() => setModule(m)}
                                                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                                                    module === m ? 'bg-[#AF9460] border-[#AF9460] text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-[#AF9460]/40'
                                                }`}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] text-zinc-400 mb-1 uppercase tracking-wider font-medium">Acción</p>
                                    <div className="flex flex-wrap gap-1">
                                        {SUGGESTED_ACTIONS.map((a) => (
                                            <button key={a} type="button" onClick={() => setAction(a)}
                                                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                                                    action === a ? 'bg-[#AF9460] border-[#AF9460] text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-[#AF9460]/40'
                                                }`}>{a}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Field label="Nombre (módulo.acción)" error={errors.name?.[0]}>
                        <Inp value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. usuarios.crear" required />
                        <p className="text-[9px] text-zinc-400 mt-1">
                            Formato: <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">modulo.accion</code>
                        </p>
                    </Field>

                    <Field label="Guard" error={errors.guard_name?.[0]}>
                        <Inp value={form.guard_name} onChange={(e) => setForm({ ...form, guard_name: e.target.value })} placeholder="web" />
                    </Field>
                </form>
            </Modal>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Permiso"
                message={`¿Eliminar "${confirm?.name}"? Se quitará de todos los roles que lo tengan asignado.`}
            />
        </div>
    );
}
