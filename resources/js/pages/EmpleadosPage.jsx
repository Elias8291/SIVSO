import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCheck, ArrowRightLeft, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader, SearchInput, Card, DataTable,
    StatusBadge, ConfirmDialog, Pagination, Modal,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

function Sel({ children, ...props }) {
    return (
        <div className="relative w-full">
            <select
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/40 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-brand-gold/40 focus:ring-1 focus:ring-brand-gold/40 shadow-sm transition-all cursor-pointer appearance-none touch-manipulation"
                {...props}
            >
                {children}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2.5} />
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-3 bg-brand-gold/5 border border-brand-gold/20 rounded-xl">
                        <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
                            {empleado.nombre_completo}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500 mt-0.5">NUE: {empleado.nue}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nueva Dependencia</label>
                            <Sel value={dep} onChange={e => { setDep(e.target.value); setDel(''); }} required>
                                <option value="">Seleccionar...</option>
                                {dependencias.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                                ))}
                            </Sel>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nueva Delegación</label>
                            <Sel value={del} onChange={e => setDel(e.target.value)} disabled={!dep} required>
                                <option value="">Seleccionar...</option>
                                {delegaciones.map(d => (
                                    <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                                ))}
                            </Sel>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation min-h-[44px]">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving || !dep || !del} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all touch-manipulation min-h-[44px]">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
        <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-brand-gold/10 dark:bg-brand-gold/15 border border-brand-gold/20 text-[11px] font-bold text-brand-gold uppercase tracking-wider shadow-sm shadow-brand-gold/5">
            {label}
            <button onClick={onClear} className="size-[18px] rounded-full hover:bg-brand-gold/20 dark:hover:bg-brand-gold/30 flex items-center justify-center transition-colors">
                <X size={11} strokeWidth={2.5} />
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
                <span className="inline-flex items-center px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-800/40 text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 tracking-widest shadow-sm">
                    {v}
                </span>
            ),
        },
        {
            key: 'nombre_completo',
            label: 'Colaborador',
            render: (v, row) => (
                <div>
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{v || '—'}</p>
                    {row.user_id && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            <UserCheck size={10} strokeWidth={2.5} /> Cuenta vinculada
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
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{v}</p>
                    {row.dependencia_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[160px] truncate leading-tight">{row.dependencia_nombre}</p>
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
                    <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{v}</p>
                    {row.delegacion_nombre && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[140px] truncate leading-tight">{row.delegacion_nombre}</p>
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
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nuevo Empleado
                            </button>
                            <button onClick={() => navigate('/dashboard/empleados/nuevo')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md shadow-black/10 dark:shadow-white/5 border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
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
            <div className="bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 mb-6 shadow-sm shadow-zinc-900/5 dark:shadow-none">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">Filtrar por Dependencia</label>
                        <Sel value={filterDep} onChange={(e) => { setFilterDep(e.target.value); setFilterDel(''); }}>
                            <option value="">Todas las dependencias</option>
                            {dependencias.map(d => (
                                <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                            ))}
                        </Sel>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">Delegación correspondiente</label>
                        <Sel value={filterDel} onChange={(e) => setFilterDel(e.target.value)} disabled={!filterDep}>
                            <option value="">Todas las delegaciones</option>
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

            <Card title={`Empleados${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable
                    columns={columns}
                    data={empleados}
                    loading={loading}
                    onEdit={canEdit ? ((row) => navigate(`/dashboard/empleados/${row.id}/editar`)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'Sin empleados registrados.'}
                    extraActions={canEdit ? [{
                        label: 'Cambiar Delegación',
                        icon: <ArrowRightLeft size={14} />,
                        onClick: (row) => setChangeDelegacion(row),
                        variant: 'primary',
                    }] : []}
                />
                {meta.last_page > 1 && (
                    <div className="px-6 pb-4 pt-2 border-t border-zinc-50 dark:border-zinc-800/40">
                        <Pagination meta={meta} page={page} onPageChange={setPage} />
                    </div>
                )}
            </Card>

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
