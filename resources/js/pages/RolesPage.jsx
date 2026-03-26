import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import {
    PageHeader, SearchInput, PageAddButton, Card, DataTable, ConfirmDialog, Pagination,
    FilterToolbar, FilterToolbarRow, FilterSelectShell,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function RolesPage() {
    const navigate = useNavigate();
    const [guardFilter, setGuardFilter] = useState('');
    const { data: roles, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/roles', {
            perPage: 15,
            extra: { guard_name: guardFilter || undefined },
            extraKey: `guard:${guardFilter}`,
        });

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
                    <PageAddButton onClick={() => navigate('/dashboard/roles/nuevo')} label="Nuevo rol" />
                }
            />

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar rol"
                    placeholder="Nombre del rol…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FilterToolbarRow>
                    <FilterSelectShell id="roles-guard" label="Guard" icon={Shield} className="min-w-0 sm:w-[10rem]">
                        <select
                            id="roles-guard"
                            value={guardFilter}
                            onChange={(e) => setGuardFilter(e.target.value)}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                        >
                            <option value="">Todos</option>
                            <option value="web">web</option>
                        </select>
                    </FilterSelectShell>
                </FilterToolbarRow>
            </FilterToolbar>

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
