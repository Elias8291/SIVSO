import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCheck, ArrowRightLeft, ChevronDown, X, Key, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader, SearchInput, Card, DataTable,
    StatusBadge, ConfirmDialog, Pagination, Modal,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

function Sel({ children, ...props }) {
    return (
        <div className="relative w-full group">
            <select
                className="w-full bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[13px] font-medium focus:ring-0 focus:border-brand-gold dark:focus:border-brand-gold transition-colors py-2 pl-0 pr-8 appearance-none cursor-pointer"
                {...props}
            >
                {children}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none group-hover:text-brand-gold transition-colors" strokeWidth={2} />
        </div>
    );
}

function ModalCambiarDelegacion({ empleado, onClose, onSuccess, dependencias }) {
    const [dep, setDep] = useState('');
    const [del, setDel] = useState('');
    const [delegaciones, setDelegaciones] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (empleado) {
            setDep(empleado.dependencia_clave || '');
            setDel(empleado.delegacion_clave || '');
        }
    }, [empleado]);

    useEffect(() => {
        if (!dep) { setDelegaciones([]); return; }
        api.get(`/api/delegaciones?ur=${dep}`).then(r => setDelegaciones(r.data ?? [])).catch(() => { });
    }, [dep]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!dep || !del) return;
        setSaving(true);
        try {
            await api.put(`/api/empleados/${empleado.id}`, {
                nue: empleado.nue,
                nombre: empleado.nombre,
                apellido_paterno: empleado.apellido_paterno,
                apellido_materno: empleado.apellido_materno,
                dependencia_clave: dep,
                delegacion_clave: del,
            });
            onSuccess();
        } catch (err) {
            alert(err?.response?.data?.message || err.message || 'Error al cambiar la delegación');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={!!empleado} onClose={onClose} title="Mover Empleado" size="sm">
            {empleado && (
                <form onSubmit={handleSubmit} className="space-y-8 mt-2">
                    <div className="border-l-2 border-brand-gold pl-4 py-1">
                        <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Colaborador Seleccionado</p>
                        <p className="text-zinc-900 dark:text-zinc-100 font-medium">{empleado.nombre_completo}</p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-1">NUE: {empleado.nue}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="w-full relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 transition-colors group-focus-within:text-brand-gold">Nueva Dependencia</label>
                            <Sel value={dep} onChange={e => { setDep(e.target.value); setDel(''); }} required>
                                <option value="">Seleccionar...</option>
                                {dependencias.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                                ))}
                            </Sel>
                        </div>

                        <div className="w-full relative group">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 transition-colors group-focus-within:text-brand-gold">Nueva Delegación</label>
                            <Sel value={del} onChange={e => setDel(e.target.value)} disabled={!dep} required>
                                <option value="">Seleccionar...</option>
                                {delegaciones.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                                ))}
                            </Sel>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving || !dep || !del} className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all">
                            {saving ? 'GUARDANDO...' : 'REASIGNAR'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

/* ── Chip de filtro ────────────────────────────────────────────────────────── */
function FilterChip({ label, onClear }) {
    return (
        <span className="inline-flex items-center gap-2 pl-3 pr-1 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest transition-colors">
            {label}
            <button onClick={onClear} className="size-5 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
                <X size={12} strokeWidth={2.5} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
            </button>
        </span>
    );
}

export default function EmpleadosPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_empleados');
    const [changeDelegacion, setChangeDelegacion] = useState(null);
    const [dependencias, setDependencias] = useState([]);
    const [delegaciones, setDelegaciones] = useState([]);
    const [filterDep, setFilterDep] = useState('');
    const [filterDel, setFilterDel] = useState('');

    useEffect(() => {
        api.get('/api/dependencias?search=').then(r => setDependencias(r.data ?? [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!filterDep) { setDelegaciones([]); setFilterDel(''); return; }
        api.get(`/api/delegaciones?ur=${filterDep}`)
            .then(r => setDelegaciones(r.data ?? [])).catch(() => { });
    }, [filterDep]);

    const buildExtra = useCallback(() => {
        const p = {};
        if (filterDep) p.dependencia_clave = filterDep;
        if (filterDel) p.delegacion_clave = filterDel;
        return p;
    }, [filterDep, filterDel]);

    const extraParams = buildExtra();
    const extraKey = JSON.stringify(extraParams);

    const { data: empleados, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/empleados', { perPage: 20, extra: extraParams, extraKey });

    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(null);

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
                <span className="text-[12px] font-mono font-medium text-zinc-500 dark:text-zinc-400 tracking-widest">{v}</span>
            ),
        },
        {
            key: 'nombre_completo',
            label: 'Colaborador',
            render: (v, row) => (
                <div>
                    <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 uppercase tracking-wide leading-tight">{v || '—'}</p>
                    {row.user_id && (
                        <p className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                            <Key size={10} strokeWidth={2.5} /> Credencial asignada
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'dependencia_clave',
            label: 'Adscripción (UR)',
            render: (v, row) => (
                <div>
                    <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">{v}</p>
                    {row.dependencia_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[180px] truncate leading-tight hidden lg:block">{row.dependencia_nombre}</p>
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
                    <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">{v}</p>
                    {row.delegacion_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[140px] truncate leading-tight hidden lg:block">{row.delegacion_nombre}</p>
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
                    canEdit ? (
                        <>
                            <button onClick={() => navigate('/dashboard/empleados/nuevo')}
                                className="hidden sm:flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 hover:scale-105 active:scale-[0.98] transition-all whitespace-nowrap">
                                <Plus size={14} strokeWidth={2.5} /> NUEVO EMPLEADO
                            </button>
                            <button onClick={() => navigate('/dashboard/empleados/nuevo')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md shadow-black/10 dark:shadow-white/5 border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={
                    <div className="relative">
                        <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2.5} />
                        <input
                            className="w-full sm:w-80 bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[14px] placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:ring-0 focus:border-brand-gold dark:focus:border-brand-gold transition-colors py-2 pl-7 pr-0"
                            placeholder="Buscar por NUE o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                }
            />

            {/* Filtros formales */}
            <div className="mb-10 lg:px-2">
                <div className="flex flex-col sm:flex-row gap-8">
                    <div className="flex-1 max-w-md w-full relative group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 transition-colors group-focus-within:text-brand-gold">Filtrar Unidad Responsable</label>
                        <Sel value={filterDep} onChange={(e) => { setFilterDep(e.target.value); setFilterDel(''); }}>
                            <option value="">Cualquier dependencia...</option>
                            {dependencias.map(d => (
                                <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                            ))}
                        </Sel>
                    </div>
                    <div className="flex-1 max-w-md w-full relative group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 transition-colors group-focus-within:text-brand-gold">Filtrar Delegación</label>
                        <Sel value={filterDel} onChange={(e) => setFilterDel(e.target.value)} disabled={!filterDep}>
                            <option value="">Cualquier delegación...</option>
                            {delegaciones.map(d => (
                                <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                            ))}
                        </Sel>
                    </div>
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

            <div className="mt-4 lg:mx-2">
                <Card
                    title="Directorio de Colaboradores"
                    action={
                        meta.total > 0 ? (
                            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded">
                                {meta.total} registros
                            </span>
                        ) : null
                    }
                >
                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columns}
                            data={empleados}
                            loading={loading}
                            onEdit={canEdit ? ((row) => navigate(`/dashboard/empleados/${row.id}/editar`)) : undefined}
                            onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                            emptyMessage={search ? `Sin coincidencias para "${search}".` : 'No hay empleados registrados.'}
                            extraActions={canEdit ? [{
                                label: 'Reasignar',
                                icon: <ArrowRightLeft size={14} />,
                                onClick: (row) => setChangeDelegacion(row),
                                variant: 'primary',
                            }] : []}
                        />
                    </div>
                    {meta.last_page > 1 && (
                        <Pagination meta={meta} page={page} onPageChange={setPage} />
                    )}
                </Card>
            </div>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Empleado"
                message={`¿Eliminar a "${confirm?.nombre_completo}"? Esta acción no se puede deshacer.`}
            />

            <ModalCambiarDelegacion
                empleado={changeDelegacion}
                dependencias={dependencias}
                onClose={() => setChangeDelegacion(null)}
                onSuccess={() => { setChangeDelegacion(null); reload(); }}
            />
        </div>
    );
}
