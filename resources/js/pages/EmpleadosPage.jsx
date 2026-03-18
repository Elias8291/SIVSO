import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, UserCheck, Search, X } from 'lucide-react';
import {
    PageHeader, SearchInput, Card, DataTable,
    StatusBadge, Modal, ConfirmDialog, Pagination,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const EMPTY_FORM = {
    nue: '', nombre: '', apellido_paterno: '', apellido_materno: '',
    dependencia_clave: '', delegacion_clave: '', activo: true, user_id: '',
};

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
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

function Sel({ children, ...props }) {
    return (
        <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/50 transition-all"
            {...props}
        >
            {children}
        </select>
    );
}

/* ── Chip de filtro ────────────────────────────────────────────────────────── */
function FilterChip({ label, onClear }) {
    return (
        <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[#AF9460]/10 border border-[#AF9460]/25 text-[12px] font-bold text-[#AF9460]">
            {label}
            <button onClick={onClear} className="size-4 rounded-full hover:bg-[#AF9460]/20 flex items-center justify-center transition-all">
                ×
            </button>
        </span>
    );
}

export default function EmpleadosPage() {
    /* ── Catálogos para filtros y modal ─────────────────────────────────── */
    const [dependencias, setDependencias] = useState([]);
    const [delegaciones, setDelegaciones] = useState([]);

    // Filtros activos (panel superior)
    const [filterDep, setFilterDep] = useState('');
    const [filterDel, setFilterDel] = useState('');

    // Delegaciones filtradas por dependencia en el modal
    const [delModal, setDelModal] = useState([]);

    useEffect(() => {
        api.get('/api/dependencias?search=').then(r => setDependencias(r.data ?? [])).catch(() => {});
    }, []);

    // Cargar delegaciones cuando cambia el filtro de dependencia
    useEffect(() => {
        if (!filterDep) { setDelegaciones([]); setFilterDel(''); return; }
        api.get(`/api/delegaciones?ur=${filterDep}`)
            .then(r => setDelegaciones(r.data ?? [])).catch(() => {});
    }, [filterDep]);

    /* ── Paginación con filtros adicionales ─────────────────────────────── */
    const buildExtra = useCallback(() => {
        const p = {};
        if (filterDep) p.dependencia_clave = filterDep;
        if (filterDel) p.delegacion_clave  = filterDel;
        return p;
    }, [filterDep, filterDel]);

    const extraParams = buildExtra();
    const extraKey    = JSON.stringify(extraParams);

    const { data: empleados, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/empleados', { perPage: 20, extra: extraParams, extraKey });

    /* ── CRUD ────────────────────────────────────────────────────────────── */
    const [saving, setSaving]     = useState(false);
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [confirm, setConfirm]   = useState(null);

    // Buscador de usuario tipo-ahead (declarado DESPUÉS de modal)
    const [userSearch,  setUserSearch]  = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userLinked,  setUserLinked]  = useState(null);
    const userSearchTimer               = useRef(null);

    useEffect(() => {
        if (!modal) return;
        clearTimeout(userSearchTimer.current);
        if (!userSearch.trim()) { setUserResults([]); return; }
        userSearchTimer.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(userSearch)}&per_page=8`)
                .then(r => setUserResults(r.data ?? [])).catch(() => {});
        }, 350);
        return () => clearTimeout(userSearchTimer.current);
    }, [userSearch, modal]);

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    // Delegaciones en el modal (reactivas al dependencia_clave del form)
    useEffect(() => {
        if (!form.dependencia_clave) { setDelModal([]); return; }
        api.get(`/api/delegaciones?ur=${form.dependencia_clave}`)
            .then(r => setDelModal(r.data ?? [])).catch(() => {});
    }, [form.dependencia_clave]);

    const resetUserSearch = () => { setUserSearch(''); setUserResults([]); };

    const openCreate = () => {
        setForm(EMPTY_FORM); setErrors({}); setSelected(null);
        setUserLinked(null); resetUserSearch(); setModal('create');
    };
    const openEdit = (row) => {
        setForm({
            nue:               row.nue              ?? '',
            nombre:            row.nombre            ?? '',
            apellido_paterno:  row.apellido_paterno  ?? '',
            apellido_materno:  row.apellido_materno  ?? '',
            dependencia_clave: row.dependencia_clave ?? '',
            delegacion_clave:  row.delegacion_clave  ?? '',
            activo:            row.activa,
            user_id:           row.user_id           ?? '',
        });
        // Si ya tiene usuario vinculado, cargarlo
        if (row.user_id) {
            api.get(`/api/usuarios?search=&per_page=100`).then(r => {
                const u = (r.data ?? []).find(u => u.id === row.user_id);
                setUserLinked(u ?? { id: row.user_id, name: `Usuario #${row.user_id}`, rfc: '' });
            }).catch(() => setUserLinked({ id: row.user_id, name: `Usuario #${row.user_id}`, rfc: '' }));
        } else {
            setUserLinked(null);
        }
        resetUserSearch();
        setErrors({}); setSelected(row); setModal('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setErrors({});
        try {
            const payload = { ...form, user_id: form.user_id || null };
            if (modal === 'create') await api.post('/api/empleados', payload);
            else                    await api.put(`/api/empleados/${selected.id}`, payload);
            setModal(null); reload();
        } catch (err) { setErrors(err.errors ?? { general: err.message }); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setSaving(true);
        try { await api.delete(`/api/empleados/${confirm.id}`); setConfirm(null); reload(); }
        catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleToggle = async (row) => {
        try { await api.patch(`/api/empleados/${row.id}/toggle`); reload(); }
        catch (err) { alert(err.message); }
    };

    /* ── Columnas ────────────────────────────────────────────────────────── */
    const columns = [
        {
            key: 'nue',
            label: 'NUE',
            render: (v) => (
                <span className="text-[12px] font-mono font-bold text-zinc-700 dark:text-zinc-300 tracking-wider">{v}</span>
            ),
        },
        {
            key: 'nombre_completo',
            label: 'Nombre',
            render: (v, row) => (
                <div>
                    <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{v || '—'}</p>
                    {row.user_id && (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-[#AF9460] font-semibold">
                            <UserCheck size={9} strokeWidth={2.5} /> Vinculado
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'dependencia_clave',
            label: 'Dependencia',
            render: (v, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{v}</p>
                    {row.dependencia_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[160px] truncate">{row.dependencia_nombre}</p>
                    )}
                </div>
            ),
            hideOnMobile: true,
        },
        {
            key: 'delegacion_clave',
            label: 'Delegación',
            render: (v, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{v}</p>
                    {row.delegacion_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[140px] truncate">{row.delegacion_nombre}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'activa',
            label: 'Estado',
            render: (v) => <StatusBadge status={v ? 'activo' : 'inactivo'} />,
        },
    ];

    /* ── Chips de filtro activos ─────────────────────────────────────────── */
    const depLabel = dependencias.find(d => String(d.clave) === String(filterDep));
    const delLabel = delegaciones.find(d => d.clave === filterDel);

    return (
        <div>
            <PageHeader
                title="Empleados"
                description="Registro de empleados vinculados al sistema de vestuario."
                actions={
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        <Plus size={13} strokeWidth={2.5} /> Nuevo Empleado
                    </button>
                }
                search={
                    <SearchInput
                        placeholder="Buscar por NUE, nombre o apellido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            {/* Filtros por dependencia / delegación */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                    <Sel value={filterDep} onChange={(e) => { setFilterDep(e.target.value); setFilterDel(''); }}>
                        <option value="">Todas las dependencias</option>
                        {dependencias.map(d => (
                            <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                        ))}
                    </Sel>
                </div>
                <div className="flex-1">
                    <Sel value={filterDel} onChange={(e) => setFilterDel(e.target.value)} disabled={!filterDep}>
                        <option value="">Todas las delegaciones</option>
                        {delegaciones.map(d => (
                            <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                        ))}
                    </Sel>
                </div>
            </div>

            {/* Chips de filtros activos */}
            {(filterDep || filterDel) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {filterDep && (
                        <FilterChip
                            label={depLabel ? `${depLabel.clave} — ${depLabel.nombre?.slice(0, 30)}` : filterDep}
                            onClear={() => { setFilterDep(''); setFilterDel(''); }}
                        />
                    )}
                    {filterDel && (
                        <FilterChip
                            label={delLabel ? `Del. ${delLabel.clave}` : filterDel}
                            onClear={() => setFilterDel('')}
                        />
                    )}
                </div>
            )}

            <Card title={`Empleados${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable
                    columns={columns}
                    data={empleados}
                    loading={loading}
                    onEdit={openEdit}
                    onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'Sin empleados registrados.'}
                    extraActions={[]}
                />
                {meta.last_page > 1 && (
                    <div className="px-6 pb-4 pt-2 border-t border-zinc-50 dark:border-zinc-800/40">
                        <Pagination meta={meta} page={page} onPageChange={setPage} />
                    </div>
                )}
            </Card>

            {/* ── Modal crear / editar ────────────────────────────────────── */}
            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}
                size="md"
                footer={
                    <>
                        <button type="button" onClick={() => setModal(null)} disabled={saving}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" form="emp-form" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold disabled:opacity-60 hover:opacity-90 transition-all">
                            {saving && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {modal === 'create' ? 'Crear Empleado' : 'Guardar Cambios'}
                        </button>
                    </>
                }
            >
                <form id="emp-form" onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{errors.general}</p>
                    )}

                    {/* NUE */}
                    <Field label="NUE (Número Único de Empleado)" error={errors.nue?.[0]}>
                        <Inp value={form.nue} onChange={f('nue')} placeholder="Ej. 00012345" maxLength={15} required />
                    </Field>

                    {/* Nombre */}
                    <div className="grid grid-cols-1 gap-3">
                        <Field label="Apellido Paterno" error={errors.apellido_paterno?.[0]}>
                            <Inp value={form.apellido_paterno} onChange={f('apellido_paterno')} placeholder="Apellido paterno" maxLength={80} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Apellido Materno" error={errors.apellido_materno?.[0]}>
                                <Inp value={form.apellido_materno} onChange={f('apellido_materno')} placeholder="Apellido materno" maxLength={80} />
                            </Field>
                            <Field label="Nombre(s)" error={errors.nombre?.[0]}>
                                <Inp value={form.nombre} onChange={f('nombre')} placeholder="Nombre(s)" maxLength={80} />
                            </Field>
                        </div>
                    </div>

                    {/* Dependencia → Delegación en cascada */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Dependencia" error={errors.dependencia_clave?.[0]}>
                            <Sel value={form.dependencia_clave}
                                onChange={(e) => setForm(p => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))}
                                required>
                                <option value="">Seleccionar…</option>
                                {dependencias.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave}</option>
                                ))}
                            </Sel>
                        </Field>
                        <Field label="Delegación" error={errors.delegacion_clave?.[0]}>
                            <Sel value={form.delegacion_clave} onChange={f('delegacion_clave')}
                                disabled={!form.dependencia_clave} required>
                                <option value="">Seleccionar…</option>
                                {delModal.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                                ))}
                            </Sel>
                        </Field>
                    </div>

                    {/* Usuario vinculado — buscador tipo-ahead */}
                    <Field label="Vincular a usuario del sistema (opcional)" error={errors.user_id?.[0]}>
                        {userLinked ? (
                            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#AF9460]/40 bg-[#AF9460]/5">
                                <div>
                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{userLinked.name}</p>
                                    <p className="text-[11px] text-zinc-400 font-mono">{userLinked.rfc}</p>
                                </div>
                                <button type="button"
                                    onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }}
                                    className="size-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                                    <input
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Buscar por nombre o RFC…"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 transition-all"
                                    />
                                </div>
                                {userResults.length > 0 && (
                                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60 overflow-hidden max-h-36 overflow-y-auto">
                                        {userResults.map(u => (
                                            <button key={u.id} type="button"
                                                onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }}
                                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#AF9460]/5 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{u.name}</p>
                                                    <p className="text-[11px] text-zinc-400 font-mono">{u.rfc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!userResults.length && userSearch && (
                                    <p className="text-[12px] text-zinc-400 px-1">Sin resultados.</p>
                                )}
                            </div>
                        )}
                    </Field>

                    {/* Activo */}
                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all">
                        <span className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Empleado activo</span>
                        <div onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.activo ? 'bg-[#AF9460]' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${form.activo ? 'left-4' : 'left-0.5'}`} />
                        </div>
                    </label>
                </form>
            </Modal>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Empleado"
                message={`¿Eliminar a "${confirm?.nombre_completo}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
