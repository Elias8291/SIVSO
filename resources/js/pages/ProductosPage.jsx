import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ToggleLeft, ToggleRight, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, StatusBadge, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const CATEGORY_STYLE = {
    default: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-zinc-400' },
    2711: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    2712: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-400' },
    2721: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-400' },
};
const catStyle = (partida) => CATEGORY_STYLE[partida] ?? CATEGORY_STYLE.default;

function fmtPrecio(v) {
    if (v == null || v === '') return '—';
    return `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ProductoCard({ item }) {
    const st = catStyle(item.partida);
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-full">
            <div className={`${st.bg} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${st.dot}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${st.text}`}>
                        {item.clave_vestuario || item.codigo || `Partida ${item.partida}`}
                    </span>
                </div>
                {item.marca && <span className={`text-[9px] font-bold uppercase tracking-widest ${st.text} opacity-70`}>{item.marca}</span>}
            </div>
            <div className="px-4 py-4 flex-1 flex flex-col gap-3">
                <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-3">
                    {item.descripcion}
                </p>
                <div className="flex items-center gap-4 flex-wrap mt-auto pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Precio</span>
                        <span className="text-xs font-black text-brand-gold">{fmtPrecio(item.precio_unitario)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Unidad</span>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.unidad || '—'}</span>
                    </div>
                    {item.medida && (
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Medida</span>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.medida}</span>
                        </div>
                    )}
                    <div className="flex flex-col ml-auto items-end">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Estado</span>
                        <StatusBadge status={item.activo ? 'activo' : 'inactivo'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductosPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_catalogo');
    const [viewMode, setViewMode] = useState(canEdit ? 'table' : 'grid');
    const [anioFiltro, setAnioFiltro] = useState(() => new Date().getFullYear());

    const { data: productos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/productos', {
            perPage: viewMode === 'grid' ? 24 : 20,
            extra: { anio: anioFiltro },
            extraKey: String(anioFiltro),
        });

    const aniosOpciones = useMemo(() => {
        const fromApi = meta?.anios_precios;
        const cur = new Date().getFullYear();
        if (fromApi?.length) return [...new Set([cur, ...fromApi])].sort((a, b) => b - a);
        return [cur, cur - 1, cur - 2];
    }, [meta?.anios_precios]);

    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const handleDelete = async () => {
        setSaving(true);
        try { await api.delete(`/api/productos/${confirm.id}`); setConfirm(null); reload(); }
        catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleToggle = async (row) => {
        try { await api.patch(`/api/productos/${row.id}/toggle`); reload(); }
        catch (err) { alert(err.message); }
    };

    const columns = [
        {
            key: 'clave_vestuario',
            label: 'Clave',
            render: (v, row) => (
                <div>
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{v || row.codigo || '—'}</p>
                    {row.marca && <p className="text-[14px] text-zinc-400 mt-0.5">{row.marca}</p>}
                </div>
            ),
        },
        {
            key: 'descripcion',
            label: 'Descripción',
            render: (v) => (
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 max-w-xs leading-snug line-clamp-2">{v}</p>
            ),
        },
        {
            key: 'partida',
            label: 'Partida',
            render: (v, row) => (
                <span className="text-[13px] text-zinc-500">{v}{row.lote ? `-${row.lote}` : ''}</span>
            ),
        },
        {
            key: 'unidad',
            label: 'Unidad / Medida',
            render: (v, row) => (
                <span className="text-[13px] text-zinc-500">{v || '—'}{row.medida ? ` / ${row.medida}` : ''}</span>
            ),
        },
        {
            key: 'precio_unitario',
            label: 'Precio',
            render: (_, row) => (
                <span className="text-[13px] font-bold text-brand-gold tabular-nums">{fmtPrecio(row.precio_unitario)}</span>
            ),
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (v) => <StatusBadge status={v ? 'activo' : 'inactivo'} />,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Productos"
                description={`Catálogo de artículos — precios y claves del ejercicio ${anioFiltro}.`}
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => navigate('/dashboard/productos/nuevo')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nuevo Producto
                            </button>
                            <button onClick={() => navigate('/dashboard/productos/nuevo')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md shadow-black/10 dark:shadow-white/5 border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SearchInput
                            placeholder="Buscar por descripción, clave, código o marca..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                            <label className="sr-only">Año</label>
                            <select
                                value={anioFiltro}
                                onChange={(e) => setAnioFiltro(Number(e.target.value))}
                                className="px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 text-[12px] font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/25"
                                title="Filtrar precios por ejercicio"
                            >
                                {aniosOpciones.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-800 text-brand-gold' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                title="Vista de cuadrícula"
                            >
                                <LayoutGrid size={16} strokeWidth={2} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-zinc-100 dark:bg-zinc-800 text-brand-gold' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                title="Vista de lista"
                            >
                                <List size={16} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                }
            />

            {viewMode === 'table' ? (
                <Card title={`Productos${meta.total ? ` (${meta.total})` : ''} · ${anioFiltro}`}>
                    <DataTable
                        columns={columns}
                        data={productos}
                        loading={loading}
                        onEdit={canEdit ? ((row) => navigate(`/dashboard/productos/${row.id}/editar`)) : undefined}
                        onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                        extraActions={canEdit ? [
                            {
                                label: 'Activar / Desactivar',
                                icon: (row) => row?.activo
                                    ? <ToggleRight size={14} strokeWidth={1.8} />
                                    : <ToggleLeft size={14} strokeWidth={1.8} />,
                                onClick: handleToggle,
                                variant: 'success',
                            },
                        ] : []}
                        emptyMessage="Sin productos registrados."
                    />
                    {meta.last_page > 1 && (
                        <div className="px-6 pb-4 pt-2 border-t border-zinc-50 dark:border-zinc-800/40">
                            <Pagination meta={meta} page={page} onPageChange={setPage} />
                        </div>
                    )}
                </Card>
            ) : (
                <div className="space-y-6">
                    {loading ? (
                        <div className="py-16 flex justify-center">
                            <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="py-16 text-center text-sm text-zinc-500">Sin productos registrados.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productos.map(p => (
                                <ProductoCard key={p.id} item={p} />
                            ))}
                        </div>
                    )}
                    
                    {meta.last_page > 1 && (
                        <div className="flex justify-center pt-4">
                            <Pagination meta={meta} page={page} onPageChange={setPage} />
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Producto"
                message={`¿Eliminar "${confirm?.descripcion?.slice(0, 60)}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
