import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Modal } from '../components/ui';
import { api, resolveApiUrl } from '../lib/api';
import { aniosParaPdfSeleccion, aniosPdfConValorSeleccionado } from '../lib/aniosPdf';

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

function FormModal({ item, onClose, onSaved }) {
    const isEdit = !!item?.id;
    const [form, setForm] = useState({ clave: '', nombre: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) setForm({ clave: item.clave ?? '', nombre: item.nombre ?? '' });
        else setForm({ clave: '', nombre: '' });
        setErrors({});
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) await api.put(`/api/delegaciones/${item.id}`, form);
            else await api.post('/api/delegaciones', form);
            onSaved();
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally { setSaving(false); }
    };

    return (
        <Modal open={!!item || item === 'new'} onClose={onClose} title={isEdit ? 'Editar Delegación' : 'Nueva Delegación'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{errors.general}</p>}
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Clave</label>
                    <input type="text" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value.toUpperCase() })}
                        placeholder="Ej. 3B-101" maxLength={20} required className={inputClass} />
                    {errors.clave && <p className="text-[11px] text-red-500">{errors.clave[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nombre (opcional)</label>
                    <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        placeholder="Nombre descriptivo" className={inputClass} />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                    <button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all">
                        {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function DelegacionesPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const canEdit = can('editar_delegaciones');
    const canExportarPdfAcuses = can('ver_delegaciones') || can('ver_empleados') || can('ver_mi_delegacion');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);
    const [pdfAnio, setPdfAnio] = useState(() => new Date().getFullYear());
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [pdfErr, setPdfErr] = useState(null);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/delegaciones/all${q ? `?search=${encodeURIComponent(q)}` : ''}`)
            .then(r => setData(r.data ?? []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        api.get('/api/periodos/activo')
            .then((r) => {
                const anio = r.data?.anio;
                if (typeof anio === 'number' && anio >= 2000 && anio <= 2100) {
                    setPdfAnio(anio);
                }
            })
            .catch(() => {});
    }, []);

    const calAnio = new Date().getFullYear();
    const aniosPdfOpciones = useMemo(
        () => aniosPdfConValorSeleccionado(aniosParaPdfSeleccion(), pdfAnio),
        [pdfAnio, calAnio]
    );

    const downloadPdfDelegacion = async (row) => {
        if (!row?.id || pdfLoadingId != null) {
            return;
        }
        const anio = Number(pdfAnio);
        if (!Number.isFinite(anio) || anio < 2000 || anio > 2100) {
            setPdfErr('Seleccione un ejercicio (año) válido para el PDF.');
            return;
        }
        setPdfErr(null);
        setPdfLoadingId(row.id);
        try {
            const token = typeof document !== 'undefined'
                ? document.querySelector('meta[name="csrf-token"]')?.content ?? ''
                : '';
            const q = new URLSearchParams({ anio: String(anio) });
            const url = resolveApiUrl(`/api/mi-delegacion/delegaciones/${row.id}/acuses-pdf?${q.toString()}`);
            const res = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/pdf',
                    'X-CSRF-TOKEN': token,
                },
            });
            if (!res.ok) {
                let msg = `Error ${res.status}`;
                try {
                    const j = await res.json();
                    if (j.message) {
                        msg = j.message;
                    }
                } catch {
                    /* cuerpo no JSON */
                }
                setPdfErr(msg);
                return;
            }
            const blob = await res.blob();
            const safeDel = String(row.clave ?? 'delegacion').replace(/[^a-zA-Z0-9_-]/g, '_');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Acuses_vestuario_${safeDel}_Ej${anio}.pdf`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            setPdfErr(e.message || 'No se pudo generar el PDF.');
        } finally {
            setPdfLoadingId(null);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/delegaciones/${confirm.id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'clave',
            label: 'Clave',
            render: (v) => <span className="text-[13px] font-black text-brand-gold uppercase tracking-wider">{v}</span>,
        },
        {
            key: 'dependencias_count',
            label: 'Dependencias',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{v ?? 0}</span>,
        },
        {
            key: 'empleados_count',
            label: 'Empleados',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegaciones"
                description={
                    canExportarPdfAcuses
                        ? 'Catálogo de delegaciones. En cada fila: ver empleados y delegado, o descargar PDF de acuses de vestuario (ejercicio elegido debajo del título de la tabla).'
                        : 'Catálogo de delegaciones del sistema.'
                }
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => setEditing('new')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nueva Delegación
                            </button>
                            <button onClick={() => setEditing('new')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={<SearchInput placeholder="Buscar por clave o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            />

            <Card title={`Delegaciones (${data.length})`}>
                {canExportarPdfAcuses ? (
                    <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                            <label htmlFor="delegaciones-pdf-anio" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                Ejercicio del PDF
                            </label>
                            <select
                                id="delegaciones-pdf-anio"
                                value={String(pdfAnio)}
                                onChange={(e) => setPdfAnio(Number(e.target.value))}
                                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-[15px] sm:text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 min-w-0 sm:min-w-[5.75rem] focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 touch-manipulation"
                                aria-label="Año del ejercicio para los PDF de acuses desde esta tabla"
                            >
                                {aniosPdfOpciones.map((y) => (
                                    <option key={y} value={String(y)}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug max-w-xl">
                            Use el icono de documento en cada fila para descargar los acuses de <strong className="font-semibold text-zinc-600 dark:text-zinc-300">toda esa delegación</strong> en un solo PDF.
                        </p>
                        <p className="sm:hidden text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            En cada fila: <span className="font-semibold text-zinc-600 dark:text-zinc-300">icono PDF</span> = acuses de toda la delegación.
                        </p>
                    </div>
                ) : null}
                {pdfErr ? (
                    <p className="text-[12px] text-red-600 dark:text-red-400 px-5 pt-3" role="alert">
                        {pdfErr}
                    </p>
                ) : null}
                {pdfLoadingId != null ? (
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 px-5 pt-2 flex items-center gap-2">
                        <span className="size-3.5 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin shrink-0" aria-hidden />
                        Generando PDF…
                    </p>
                ) : null}
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    extraActions={[
                        {
                            label: 'Ver empleados y delegado',
                            icon: <Eye size={13} strokeWidth={2.2} aria-hidden />,
                            onClick: (row) => navigate(`/dashboard/delegaciones/${row.id}`),
                        },
                        ...(canExportarPdfAcuses
                            ? [{
                                label: 'PDF acuses de vestuario (toda la delegación)',
                                icon: <FileDown size={13} strokeWidth={2.2} aria-hidden />,
                                onClick: (row) => downloadPdfDelegacion(row),
                            }]
                            : []),
                    ]}
                    onEdit={canEdit ? ((row) => setEditing(row)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin delegaciones registradas."
                />
            </Card>

            <FormModal
                item={editing}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); load(); }}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Delegación"
                message={`¿Eliminar delegación "${confirm?.clave}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
