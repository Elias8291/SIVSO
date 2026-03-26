import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, FileDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    PageHeader, SearchInput, PageAddButton, Card, DataTable, ConfirmDialog,
    FilterSelectShell, FilterToolbar, FilterToolbarRow,
} from '../components/ui';
import { api, resolveApiUrl } from '../lib/api';
import { aniosParaPdfSeleccion, aniosPdfConValorSeleccionado } from '../lib/aniosPdf';

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
    const [pdfAnio, setPdfAnio] = useState(() => new Date().getFullYear());
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

    const openPdfDelegacion = (row) => {
        if (!row?.id) {
            return;
        }
        const anio = Number(pdfAnio);
        if (!Number.isFinite(anio) || anio < 2000 || anio > 2100) {
            setPdfErr('Seleccione un ejercicio (año) válido para el PDF.');
            return;
        }
        setPdfErr(null);
        const q = new URLSearchParams({ anio: String(anio) });
        const url = resolveApiUrl(`/api/mi-delegacion/delegaciones/${row.id}/acuses-pdf?${q.toString()}`);
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (!w) {
            setPdfErr('Permita ventanas emergentes para ver el PDF y guardarlo desde el visor.');
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
        {
            key: 'delegados_count',
            label: 'Delegados',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{v ?? 0}</span>,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegaciones"
                description={
                    canExportarPdfAcuses
                        ? 'Catálogo de delegaciones. En cada fila: ver empleados y delegado, o descargar PDF de acuses de vestuario (ejercicio del PDF en los filtros).'
                        : 'Catálogo de delegaciones del sistema.'
                }
                actions={
                    canEdit ? (
                        <PageAddButton onClick={() => navigate('/dashboard/delegaciones/nueva')} label="Nueva delegación" />
                    ) : null
                }
            />

            <FilterToolbar className="mb-8">
                <SearchInput
                    label="Buscar delegación"
                    placeholder="Clave o nombre…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {canExportarPdfAcuses ? (
                    <>
                        <FilterToolbarRow>
                            <FilterSelectShell
                                id="delegaciones-pdf-anio"
                                label="Ejercicio del PDF"
                                icon={Calendar}
                                className="min-w-0 sm:w-[9rem]"
                            >
                                <select
                                    id="delegaciones-pdf-anio"
                                    value={String(pdfAnio)}
                                    onChange={(e) => setPdfAnio(Number(e.target.value))}
                                    aria-label="Año del ejercicio para los PDF de acuses desde esta tabla"
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                >
                                    {aniosPdfOpciones.map((y) => (
                                        <option key={y} value={String(y)}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </FilterSelectShell>
                        </FilterToolbarRow>
                        <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            Use el icono de documento en cada fila para abrir los acuses de <strong className="font-semibold text-zinc-600 dark:text-zinc-300">toda esa delegación</strong> en un solo PDF (visor del navegador: ver, imprimir o guardar).
                        </p>
                        <p className="sm:hidden text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            En cada fila: <span className="font-semibold text-zinc-600 dark:text-zinc-300">icono PDF</span> = acuses de toda la delegación.
                        </p>
                    </>
                ) : null}
            </FilterToolbar>

            <Card title={`Delegaciones (${data.length})`}>
                {pdfErr ? (
                    <p className="text-[12px] text-red-600 dark:text-red-400 px-5 pt-3" role="alert">
                        {pdfErr}
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
                                onClick: (row) => openPdfDelegacion(row),
                            }]
                            : []),
                    ]}
                    onEdit={canEdit ? ((row) => navigate(`/dashboard/delegaciones/${row.id}/editar`)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin delegaciones registradas."
                />
            </Card>

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
