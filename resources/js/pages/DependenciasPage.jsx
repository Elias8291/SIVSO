import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog } from '../components/ui';
import { api } from '../lib/api';

export default function DependenciasPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_dependencias');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/dependencias${q ? `?search=${encodeURIComponent(q)}` : ''}`)
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
        setSaving(true);
        try {
            await api.delete(`/api/dependencias/${confirm.id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'clave',
            label: 'Clave UR',
            render: (v) => (
                <span className="text-[13px] font-black text-brand-gold uppercase tracking-wider">{v}</span>
            ),
        },
        {
            key: 'nombre',
            label: 'Nombre',
            render: (v) => (
                <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 max-w-xs leading-snug line-clamp-2">{v}</p>
            ),
        },
        {
            key: 'delegados_count',
            label: 'Delegaciones',
            render: (v) => <span className="text-[13px] text-zinc-500">{v}</span>,
        },
        {
            key: 'trabajadores_count',
            label: 'Empleados',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Dependencias"
                description="Unidades Receptoras (UR) del sistema."
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => navigate('/dashboard/dependencias/nueva')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nueva Dependencia
                            </button>
                            <button onClick={() => navigate('/dashboard/dependencias/nueva')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={
                    <SearchInput placeholder="Buscar por clave o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
                }
            />

            <Card title={`Dependencias (${data.length})`}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    onEdit={canEdit ? ((row) => navigate(`/dashboard/dependencias/${row.id}/editar`)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin dependencias registradas."
                />
            </Card>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Dependencia"
                message={`¿Eliminar "${confirm?.clave} — ${confirm?.nombre}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
