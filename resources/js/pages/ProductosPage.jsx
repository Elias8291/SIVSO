import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader, SearchInput, Card, DataTable, StatusBadge, Modal, ConfirmDialog, Pagination } from '../components/ui';
import { usePaginatedApi } from '../lib/usePaginatedApi';
import { api } from '../lib/api';

const EMPTY_FORM = {
    partida: '', partida_especifica: '', lote: '', codigo: '',
    clave_vestuario: '', descripcion: '', marca: '', unidad: '', medida: '', activo: true,
};

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-[13px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function Inp({ ...props }) {
    return (
        <input
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/50 transition-all"
            {...props}
        />
    );
}

export default function ProductosPage() {
    const { data: productos, meta, loading, search, setSearch, page, setPage, reload } =
        usePaginatedApi('/api/productos', { perPage: 20 });

    const [saving, setSaving]     = useState(false);
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [errors, setErrors]     = useState({});
    const [confirm, setConfirm]   = useState(null);

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModal('create'); };
    const openEdit   = (row) => {
        setForm({
            partida:              row.partida           ?? '',
            partida_especifica:   row.partida_especifica ?? '',
            lote:                 row.lote              ?? '',
            codigo:               row.codigo            ?? '',
            clave_vestuario:      row.clave_vestuario   ?? '',
            descripcion:          row.descripcion       ?? '',
            marca:                row.marca             ?? '',
            unidad:               row.unidad            ?? '',
            medida:               row.medida            ?? '',
            activo:               row.activo,
        });
        setErrors({}); setSelected(row); setModal('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setErrors({});
        try {
            if (modal === 'create') await api.post('/api/productos', form);
            else                    await api.put(`/api/productos/${selected.id}`, form);
            setModal(null); reload();
        } catch (err) { setErrors(err.errors ?? { general: err.message }); }
        finally { setSaving(false); }
    };

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
                <span className="text-[13px] text-zinc-500">{v}-{row.partida_especifica}-{row.lote || '?'}</span>
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
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        <Plus size={13} strokeWidth={2.5} /> Nuevo Producto
                    </button>
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
                    onEdit={openEdit}
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

            {/* Modal crear / editar */}
            <Modal
                open={!!modal}
                onClose={() => setModal(null)}
                title={modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setModal(null)}
                            className="px-4 py-2 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                            Cancelar
                        </button>
                        <button form="form-producto" type="submit" disabled={saving}
                            className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                }
            >
                <form id="form-producto" onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <p className="text-[14px] text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">{errors.general}</p>
                    )}

                    <Field label="Descripción" error={errors.descripcion}>
                        <textarea rows={2}
                            value={form.descripcion}
                            onChange={f('descripcion')}
                            placeholder="Descripción completa del artículo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 resize-none transition-all"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Clave vestuario" error={errors.clave_vestuario}>
                            <Inp value={form.clave_vestuario} onChange={f('clave_vestuario')} placeholder="Ej. CAL-EJE-01" maxLength={30} />
                        </Field>
                        <Field label="Código" error={errors.codigo}>
                            <Inp value={form.codigo} onChange={f('codigo')} placeholder="Código interno" maxLength={30} />
                        </Field>
                        <Field label="Marca" error={errors.marca}>
                            <Inp value={form.marca} onChange={f('marca')} placeholder="Marca" maxLength={80} />
                        </Field>
                        <Field label="Unidad" error={errors.unidad}>
                            <Inp value={form.unidad} onChange={f('unidad')} placeholder="Par, Pza, Jgo…" maxLength={15} />
                        </Field>
                        <Field label="Medida" error={errors.medida}>
                            <Inp value={form.medida} onChange={f('medida')} placeholder="cm, talla…" maxLength={10} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Partida" error={errors.partida}>
                            <Inp type="number" value={form.partida} onChange={f('partida')} placeholder="Ej. 2711" />
                        </Field>
                        <Field label="P. Específica" error={errors.partida_especifica}>
                            <Inp type="number" value={form.partida_especifica} onChange={f('partida_especifica')} placeholder="Ej. 01" />
                        </Field>
                        <Field label="Lote" error={errors.lote}>
                            <Inp type="number" value={form.lote} onChange={f('lote')} placeholder="Ej. 1" />
                        </Field>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <input type="checkbox" id="activo-prod"
                            checked={form.activo}
                            onChange={(e) => setForm(p => ({ ...p, activo: e.target.checked }))}
                            className="rounded accent-[#AF9460]"
                        />
                        <label htmlFor="activo-prod" className="text-[14px] text-zinc-600 dark:text-zinc-400">
                            Producto activo en el catálogo
                        </label>
                    </div>
                </form>
            </Modal>

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
