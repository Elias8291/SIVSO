import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, StatusBadge, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function ProductosPage() {
    const navigate = useNavigate();
    const { data: productos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/productos', { perPage: 20 });

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
            key: 'activo',
            label: 'Estado',
            render: (v) => <StatusBadge status={v ? 'activo' : 'inactivo'} />,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Productos"
                description="Catálogo de artículos de vestuario y calzado."
                actions={
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
                }
                search={
                    <SearchInput
                        placeholder="Buscar por descripción, clave, código o marca..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            <Card title={`Productos${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable
                    columns={columns}
                    data={productos}
                    loading={loading}
                    onEdit={(row) => navigate(`/dashboard/productos/${row.id}/editar`)}
                    onDelete={(row) => setConfirm(row)}
                    extraActions={[
                        {
                            label: 'Activar / Desactivar',
                            icon: (row) => row?.activo
                                ? <ToggleRight size={14} strokeWidth={1.8} />
                                : <ToggleLeft size={14} strokeWidth={1.8} />,
                            onClick: handleToggle,
                            variant: 'success',
                        },
                    ]}
                    emptyMessage="Sin productos registrados."
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
                title="Eliminar Producto"
                message={`¿Eliminar "${confirm?.descripcion?.slice(0, 60)}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
