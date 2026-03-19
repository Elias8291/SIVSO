import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCheck } from 'lucide-react';
import {
    PageHeader, SearchInput, Card, DataTable,
    StatusBadge, ConfirmDialog, Pagination,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

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
    const navigate = useNavigate();
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
                    onEdit={(row) => navigate(`/dashboard/empleados/${row.id}/editar`)}
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
