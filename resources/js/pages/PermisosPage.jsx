import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

export default function PermisosPage() {
    const navigate = useNavigate();
    const { data: permisos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/permisos', { perPage: 20 });

    const [allModules, setAllModules] = useState({});
    useEffect(() => {
        api.get('/api/permisos?all=1')
            .then((r) => {
                const groups = (r.data ?? []).reduce((acc, p) => {
                    const [mod] = (p.name || '').split('.');
                    if (mod) acc[mod] = (acc[mod] ?? 0) + 1;
                    return acc;
                }, {});
                setAllModules(groups);
            })
            .catch(() => {});
    }, []);

    const [saving, setSaving]   = useState(false);
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
                const [mod, act] = val.split('.');
                return (
                    <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                            <Lock size={12} className="text-zinc-400" strokeWidth={2} />
                        </div>
                        <div>
                            <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">{val}</span>
                            {mod && act && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-px rounded bg-[#AF9460]/10 text-[#AF9460] text-[13px] font-bold uppercase">{mod}</span>
                                    <span className="text-[13px] text-zinc-400">{act}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'guard_name',
            label: 'Guard',
            render: (val) => (
                <span className="px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[12px] font-mono border border-zinc-100 dark:border-zinc-700">{val}</span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Permisos"
                description="Control granular de acciones disponibles en el sistema."
                actions={
                    <button onClick={() => navigate('/dashboard/permisos/nuevo')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        <Plus size={13} strokeWidth={2.5} /> Nuevo Permiso
                    </button>
                }
                search={
                    <SearchInput
                        placeholder="Buscar permiso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            {/* Chips resumen por módulo */}
            {Object.keys(allModules).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(allModules).map(([mod, count]) => (
                        <button key={mod} onClick={() => setSearch(mod)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold uppercase tracking-wider transition-all ${
                                search === mod
                                    ? 'bg-[#AF9460] border-[#AF9460] text-white'
                                    : 'bg-white dark:bg-zinc-800/60 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-[#AF9460]/40'
                            }`}>
                            {mod}
                            <span className={`size-4 rounded-md text-[12px] font-black flex items-center justify-center ${
                                search === mod ? 'bg-white/20 text-white' : 'bg-[#AF9460]/10 text-[#AF9460]'
                            }`}>{count}</span>
                        </button>
                    ))}
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[12px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all">
                            × Limpiar
                        </button>
                    )}
                </div>
            )}

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
