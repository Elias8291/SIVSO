import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import {
    PageHeader, SearchInput, PageAddButton, Card, DataTable, ConfirmDialog, Pagination,
    FilterToolbar, FilterToolbarRow, FilterSelectShell,
} from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

/** Etiqueta legible: módulo + acción (soporta `modulo.accion` o `accion_modulo`) */
function parsePermissionDisplay(name) {
    if (!name) return { recurso: '', accion: '', raw: '' };
    const raw = String(name);
    if (raw.includes('.')) {
        const [a, ...rest] = raw.split('.');
        return { recurso: rest.join('.'), accion: a, raw };
    }
    const parts = raw.split('_');
    if (parts.length >= 2) {
        return { accion: parts[0], recurso: parts.slice(1).join('_'), raw };
    }
    return { recurso: raw, accion: '', raw };
}

export default function PermisosPage() {
    const navigate = useNavigate();
    const [guardFilter, setGuardFilter] = useState('');
    const { data: permisos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/permisos', {
            perPage: 20,
            extra: { guard_name: guardFilter || undefined },
            extraKey: `guard:${guardFilter}`,
        });

    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/permisos/${confirm.id}`);
            setConfirm(null);
            reload();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'name',
            label: 'Permiso',
            render: (val) => {
                const { recurso, accion, raw } = parsePermissionDisplay(val);
                return (
                    <div>
                        <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">{raw}</span>
                        {(recurso || accion) && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                {accion && (
                                    <span className="px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wide">
                                        {accion}
                                    </span>
                                )}
                                {recurso && (
                                    <span className="text-[12px] text-brand-gold font-semibold">{recurso}</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'guard_name',
            label: 'Guard',
            render: (v) => (
                <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[12px] font-mono border border-zinc-100 dark:border-zinc-700">{v}</span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Permisos"
                description="Control granular de acciones disponibles en el sistema."
                actions={
                    <PageAddButton onClick={() => navigate('/dashboard/permisos/nuevo')} label="Nuevo permiso" />
                }
            />

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar permiso"
                    placeholder="Nombre del permiso…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FilterToolbarRow>
                    <FilterSelectShell id="permisos-guard" label="Guard" icon={Shield} className="min-w-0 sm:w-[10rem]">
                        <select
                            id="permisos-guard"
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

            <Card title={`Permisos${meta.total ? ` (${meta.total})` : ''}`}>
                <DataTable columns={columns} data={permisos} loading={loading}
                    onEdit={(row) => navigate(`/dashboard/permisos/${row.id}/editar`)} onDelete={(row) => setConfirm(row)}
                    emptyMessage={search ? `Sin resultados para "${search}".` : 'No hay permisos registrados.'}
                />
                <Pagination meta={meta} onPage={setPage} />
            </Card>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete} loading={saving}
                title="Eliminar Permiso"
                message={`¿Eliminar "${confirm?.name}"? Se quitará de todos los roles que lo tengan asignado.`}
            />
        </div>
    );
}
