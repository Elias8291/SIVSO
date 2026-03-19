import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function RolesPage() {
    const navigate = useNavigate();
    const { data: roles, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/roles', { perPage: 15 });

    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/roles/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'name',
            label: 'Rol',
            render: (val) => (
                <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">{val}</span>
            ),
        },
        {
            key: 'guard_name',
            label: 'Guard',
            render: (val) => (
                <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[12px] font-mono border border-zinc-100 dark:border-zinc-700">{val}</span>
            ),
        },
        {
            key: 'permisos_count',
            label: 'Permisos',
            render: (val) => <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{val}</span>,
        },
        {
            key: 'users_count',
            label: 'Usuarios',
            render: (val) => <span className="text-[13px] text-zinc-500">{val}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Roles"
                description="Grupos de permisos asignables a usuarios del sistema."
                actions={
                    <>
                        <button onClick={() => navigate('/dashboard/roles/nuevo')}
                            className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                            <Plus size={13} strokeWidth={2.5} /> Nuevo Rol
                        </button>
                        <button onClick={() => navigate('/dashboard/roles/nuevo')}
                            className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md shadow-black/10 dark:shadow-white/5 border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                            <Plus size={18} strokeWidth={2.5} />
                        </button>
                    </>
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
                    onEdit={(row) => navigate(`/dashboard/roles/${row.id}/editar`)} onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay roles registrados.'}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Rol"
                message={`¿Eliminar el rol "${confirm?.name}"? Los usuarios que lo tengan asignado lo perderán.`}
            />
        </div>
    );
}
