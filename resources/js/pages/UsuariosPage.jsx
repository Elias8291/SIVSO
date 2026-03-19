import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ToggleLeft } from 'lucide-react';
import { PageHeader, Card, DataTable, StatusBadge, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function UsuariosPage() {
    const navigate = useNavigate();
    const { data: users, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/usuarios', { perPage: 15 });

    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/usuarios/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleToggle = async (row) => {
        try {
            await api.patch(`/api/usuarios/${row.id}/toggle-activo`);
            reload();
        } catch (e) { console.error(e); }
    };

    // ── Columnas ────────────────────────────────────────────────────────
    const columns = [
        {
            key: 'name',
            label: 'Usuario',
            render: (val, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide leading-none">{val ?? '—'}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-mono leading-none">{row.rfc}</p>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Correo',
            render: (val) => <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{val ?? '—'}</span>,
        },
        {
            key: 'roles_names',
            label: 'Roles',
            render: (val) => (
                <div className="flex flex-wrap gap-1">
                    {val?.length
                        ? val.map((r) => (
                            <span key={r} className="px-2 py-0.5 rounded-lg bg-[#AF9460]/10 text-[#AF9460] text-[11px] font-bold uppercase tracking-wider border border-[#AF9460]/20">{r}</span>
                        ))
                        : <span className="text-[11px] text-zinc-400">—</span>
                    }
                </div>
            ),
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (val) => <StatusBadge status={val ? 'activo' : 'inactivo'} />,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Usuarios"
                description="Gestión de cuentas de acceso al sistema."
            />
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-stretch gap-3 mb-8">
                <input
                    type="text"
                    placeholder="Buscar por nombre, RFC o correo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2.5 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 transition-all"
                />
                <button
                    onClick={() => navigate('/dashboard/usuarios/nuevo')}
                    className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                    <Plus size={13} strokeWidth={2.5} />
                    Nuevo Usuario
                </button>
            </div>

            <button
                onClick={() => navigate('/dashboard/usuarios/nuevo')}
                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>

            <Card title={`Usuarios${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    onEdit={(row) => navigate(`/dashboard/usuarios/${row.id}/editar`)}
                    onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay usuarios registrados.'}
                    extraActions={[{
                        label: 'Activar / Desactivar',
                        icon: <ToggleLeft size={14} />,
                        onClick: handleToggle,
                        variant: 'success',
                    }]}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Usuario"
                message={`¿Estás seguro de eliminar a "${confirm?.name}"? Se eliminarán sus roles asignados.`}
            />
        </div>
    );
}
