import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, UserCheck } from 'lucide-react';
import {
    PageHeader, Card, DataTable, StatusBadge, ConfirmDialog, Pagination, SearchInput, PageAddButton,
    FilterToolbar, FilterToolbarRow, FilterSelectShell,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function UsuariosPage() {
    const navigate = useNavigate();
    const [filtroActivo, setFiltroActivo] = useState('');
    const activoExtra = filtroActivo === '' ? undefined : filtroActivo;
    const { data: users, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/usuarios', {
            perPage: 15,
            extra: { activo: activoExtra },
            extraKey: `activo:${filtroActivo}`,
        });

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
                            <span key={r} className="px-2 py-0.5 rounded-lg bg-brand-gold/10 text-brand-gold text-[11px] font-bold uppercase tracking-wider border border-brand-gold/20">{r}</span>
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
                actions={
                    <PageAddButton onClick={() => navigate('/dashboard/usuarios/nuevo')} label="Nuevo usuario" />
                }
            />
            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar usuario"
                    placeholder="Nombre, RFC o correo…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FilterToolbarRow>
                    <FilterSelectShell id="usuarios-activo" label="Estado de cuenta" icon={UserCheck} className="min-w-0 sm:w-[11rem]">
                        <select
                            id="usuarios-activo"
                            value={filtroActivo}
                            onChange={(e) => setFiltroActivo(e.target.value)}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>
                    </FilterSelectShell>
                </FilterToolbarRow>
            </FilterToolbar>

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
