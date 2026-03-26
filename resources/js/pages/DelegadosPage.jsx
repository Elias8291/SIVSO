import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader, SearchInput, PageAddButton, Card, DataTable, ConfirmDialog,
    FilterToolbar,
} from '../components/ui';
import { api } from '../lib/api';

export default function DelegadosPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_delegados');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/delegados/resumen${q ? `?search=${encodeURIComponent(q)}` : ''}`)
            .then(r => setData(r.data ?? []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
    }, [search]);

    const handleDelete = async () => {
        if (!confirm?.id) return;
        setSaving(true);
        try {
            await api.delete(`/api/delegados/${confirm.id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'delegaciones',
            label: 'Delegación / usuario',
            render: (v, row) => (
                <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                        {(v ?? []).slice(0, 6).map((d, i) => (
                            <span key={i} className="rounded bg-brand-gold/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                                {d.clave}
                            </span>
                        ))}
                    </div>
                    {row.user?.name && (
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
                            {row.user.name}
                        </p>
                    )}
                    {row.user && (
                        <p className="mt-0.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{row.user.rfc || row.user.email}</p>
                    )}
                    {row.nombre?.trim() ? (
                        <p className="text-[11px] text-zinc-400">{row.nombre}</p>
                    ) : null}
                </div>
            ),
        },
        {
            key: 'delegaciones_count',
            label: 'Delegaciones',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
        {
            key: 'trabajadores_total',
            label: 'Trabajadores',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegados"
                description="Delegados y las delegaciones que representan."
                actions={
                    canEdit ? (
                        <PageAddButton onClick={() => navigate('/dashboard/delegados/nuevo')} label="Nuevo delegado" />
                    ) : null
                }
            />

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar delegado"
                    placeholder="Nombre o clave…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </FilterToolbar>

            <div className="lg:mx-2">
                <Card
                    title="Directorio de Delegados"
                    action={data.length > 0 ? (
                        <span className="rounded bg-zinc-100 px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {data.length} registros
                        </span>
                    ) : null}
                >
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        onEdit={canEdit ? ((row) => navigate(`/dashboard/delegados/${row.id}/editar`)) : undefined}
                        onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                        emptyMessage={search ? `Sin coincidencias para "${search}".` : 'No hay delegados registrados.'}
                    />
                </Card>
            </div>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Delegado"
                message={`¿Eliminar el registro de delegado #${confirm?.id}${confirm?.delegaciones?.length ? ` (${confirm.delegaciones.map((d) => d.clave).join(', ')})` : ''}? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
