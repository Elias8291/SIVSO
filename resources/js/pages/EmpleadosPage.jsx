import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Building2, ChevronDown, Key, Layers, Shirt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader, SearchInput, PageAddButton, Card, DataTable,
    StatusBadge, ConfirmDialog, Pagination, Modal,
    FilterSelectShell, FilterToolbar, FilterToolbarRow,
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

export default function EmpleadosPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_empleados');
    const canVerProductosEmpleado = can('ver_productos_empleado');
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

    const filtrosActivos = Boolean(filterDep || filterDel || search.trim());

    const limpiarFiltros = () => {
        setFilterDep('');
        setFilterDel('');
        setSearch('');
    };

    return (
        <div>
            <PageHeader
                title="Empleados"
                description="Registro de empleados vinculados al sistema de vestuario."
                actions={
                    canEdit ? (
                        <PageAddButton
                            onClick={() => navigate('/dashboard/empleados/nuevo')}
                            label="Nuevo empleado"
                        />
                    ) : null
                }
            />

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar empleado"
                    placeholder="NUE o nombre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FilterToolbarRow
                    end={
                        filtrosActivos ? (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:border-brand-gold/30 hover:bg-brand-gold/5 hover:text-brand-gold dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-brand-gold/40"
                            >
                                Limpiar filtros
                            </button>
                        ) : null
                    }
                >
                    <FilterSelectShell id="emp-filtro-ur" label="Unidad responsable" icon={Building2} className="min-w-0 sm:max-w-md sm:flex-1">
                        <select
                            id="emp-filtro-ur"
                            value={filterDep}
                            onChange={(e) => { setFilterDep(e.target.value); setFilterDel(''); }}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                        >
                            <option value="">Todas</option>
                            {dependencias.map((d) => (
                                <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                            ))}
                        </select>
                    </FilterSelectShell>
                    <FilterSelectShell id="emp-filtro-del" label="Delegación" icon={Layers} locked={!filterDep} className="min-w-0 sm:max-w-md sm:flex-1">
                        <select
                            id="emp-filtro-del"
                            value={filterDel}
                            onChange={(e) => setFilterDel(e.target.value)}
                            disabled={!filterDep}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none disabled:cursor-not-allowed dark:text-zinc-100"
                        >
                            <option value="">Todas</option>
                            {delegaciones.map((d) => (
                                <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                            ))}
                        </select>
                    </FilterSelectShell>
                </FilterToolbarRow>
            </FilterToolbar>

            <div className="lg:mx-2">
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
                            extraActions={[
                                ...(canVerProductosEmpleado ? [{
                                    label: 'Ver productos',
                                    icon: <Shirt size={14} strokeWidth={2.5} />,
                                    onClick: (row) => navigate(`/dashboard/empleados/${row.id}/vestuario`),
                                    variant: 'secondary',
                                }] : []),
                                ...(canEdit ? [{
                                    label: 'Reasignar',
                                    icon: <ArrowRightLeft size={14} />,
                                    onClick: (row) => setChangeDelegacion(row),
                                    variant: 'primary',
                                }] : []),
                            ]}
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
