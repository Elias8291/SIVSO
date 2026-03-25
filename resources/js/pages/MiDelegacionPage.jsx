import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileDown, FileText } from 'lucide-react';
import { PageHeader, DataTable } from '../components/ui';
import { api, resolveApiUrl } from '../lib/api';
import CrearUsuarioEmpleadoModal from '../features/mi-delegacion/CrearUsuarioEmpleadoModal';

export default function MiDelegacionPage() {
    const [delegaciones, setDelegaciones] = useState([]);
    const [empleadosPorDelegacion, setEmpleadosPorDelegacion] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [successFlash, setSuccessFlash] = useState(null);
    const [search, setSearch] = useState('');
    const [crearUsuarioCtx, setCrearUsuarioCtx] = useState(null);
    const [expandidas, setExpandidas] = useState({});
    const [pdfLoteLoadingId, setPdfLoteLoadingId] = useState(null);

    const toggleExpand = (id) => setExpandidas((p) => ({ ...p, [id]: !p[id] }));

    const openAcusePdf = (empleadoId) => {
        const url = resolveApiUrl(`/api/mi-delegacion/empleados/${empleadoId}/acuse-pdf`);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const downloadAcusesPdfLote = async (delegacionId, clave) => {
        setPdfLoteLoadingId(delegacionId);
        setMessage(null);
        try {
            const token =
                typeof document !== 'undefined'
                    ? document.querySelector('meta[name="csrf-token"]')?.content
                    : '';
            const url = resolveApiUrl(`/api/mi-delegacion/delegaciones/${delegacionId}/acuses-pdf`);
            const res = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/pdf',
                    'X-CSRF-TOKEN': token ?? '',
                },
            });
            if (!res.ok) {
                let msg = `Error ${res.status}`;
                try {
                    const j = await res.json();
                    if (j.message) msg = j.message;
                } catch {
                    /* cuerpo no JSON */
                }
                setMessage(msg);
                return;
            }
            const blob = await res.blob();
            const safeClave = (clave || 'delegacion').replace(/[^a-zA-Z0-9_-]/g, '_');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Acuses_vestuario_${safeClave}.pdf`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            setMessage(e.message || 'Error al descargar el PDF.');
        } finally {
            setPdfLoteLoadingId(null);
        }
    };

    useEffect(() => {
        api.get('/api/mi-delegacion')
            .then((res) => {
                const data = res.data ?? [];
                setDelegaciones(data);
                setMessage(res.message ?? null);
                setExpandidas(data.reduce((acc, d) => ({ ...acc, [d.id]: true }), {}));
            })
            .catch((err) => {
                setDelegaciones([]);
                setMessage(err.message || 'Error al cargar delegaciones.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (delegaciones.length === 0) return;
        setEmpleadosPorDelegacion({});
        Promise.all(
            delegaciones.map((del) =>
                api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(del.clave)}&per_page=100`)
                    .then((res) => ({ id: del.id, data: res.data ?? [] }))
                    .catch((err) => { console.error("Error fetching empleados for", del.clave, err); return { id: del.id, data: [] }; })
            )
        ).then((results) => {
            const map = {};
            results.forEach(({ id, data }) => { map[id] = data; });
            setEmpleadosPorDelegacion(map);
        });
    }, [delegaciones]);

    const filterTrab = (trabajadores) => {
        if (!search.trim()) return trabajadores ?? [];
        const q = search.toLowerCase();
        return (trabajadores ?? []).filter(
            (t) =>
                (t.nombre_completo || '').toLowerCase().includes(q) ||
                (t.nue || '').toLowerCase().includes(q) ||
                (t.delegacion || '').toLowerCase().includes(q)
        );
    };

    const aplicarUsuarioCreado = (delegacionId, empleadoId, user) => {
        setEmpleadosPorDelegacion((prev) => {
            const list = prev[delegacionId];
            if (!list) return prev;
            return {
                ...prev,
                [delegacionId]: list.map((row) =>
                    row.id === empleadoId ? { ...row, user_id: user?.id ?? row.user_id } : row
                ),
            };
        });
    };

    const buildColumns = (delegacionId) => [
        {
            key: 'nombre_completo',
            label: 'Empleado',
            render: (val, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide leading-none">{val}</p>
                    <p className="text-[11px] text-zinc-400 mt-1.5 font-mono leading-none">NUE: {row.nue ?? '—'}</p>
                </div>
            )
        },
        {
            key: 'actualizado',
            label: 'Estado',
            render: (_, row) => (
                row.actualizado ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Actualizado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-zinc-400" />
                        Pendiente
                    </span>
                )
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex justify-end flex-wrap gap-2">
                    {!row.user_id && (
                        <button
                            type="button"
                            onClick={() => setCrearUsuarioCtx({ empleado: row, delegacionId })}
                            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all whitespace-nowrap"
                        >
                            Crear acceso
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => openAcusePdf(row.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all whitespace-nowrap"
                        title="Acuse de recibo (PDF)"
                    >
                        <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />
                        PDF
                    </button>
                    <Link
                        to={`/dashboard/mi-delegacion/vestuario/${row.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider border border-brand-gold/20 hover:bg-brand-gold hover:text-white transition-all whitespace-nowrap"
                    >
                        Ver vestuario
                    </Link>
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader title="Mi Delegación" description="Tus delegaciones y empleados vinculados." />

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                </div>
            ) : delegaciones.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 px-4 py-16 text-center bg-white/50 dark:bg-zinc-900/20">
                    <h3 className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 mb-1.5 uppercase tracking-wider">Sin delegaciones</h3>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6 leading-relaxed">
                        {message || 'Asigna un delegado en Mi Cuenta.'}
                    </p>
                    <Link to="/dashboard/mi-cuenta" className="inline-flex px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-bold tracking-wide uppercase hover:opacity-90 transition-all">
                        Ir a Mi Cuenta
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 mb-8">
                        {successFlash && (
                            <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 text-[12px] text-emerald-800 dark:text-emerald-200">
                                {successFlash}
                            </div>
                        )}
                        <div className="flex flex-row flex-wrap sm:flex-nowrap items-stretch gap-3">
                            <input
                                type="text"
                                placeholder="Buscar por NUE o nombre del colaborador…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 min-w-0 px-3.5 py-2.5 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {delegaciones.map((del) => {
                            const empleados = filterTrab(empleadosPorDelegacion[del.id]);
                            const loadingEmpleados = empleadosPorDelegacion[del.id] === undefined;
                            const abierta = expandidas[del.id] !== false;

                            return (
                                <div key={del.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden shadow-sm shadow-black/5 dark:shadow-none transition-all duration-300">
                                    <div className="w-full px-6 py-4 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/60">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={abierta}
                                            onClick={() => toggleExpand(del.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleExpand(del.id);
                                                }
                                            }}
                                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-lg -ml-2 pl-2 py-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/30"
                                        >
                                            <span className="size-1.5 bg-brand-gold rounded-full shrink-0" />
                                            <div className="min-w-0">
                                                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                                                    Delegación {del.clave}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                                                    {del.delegado_usuario?.rfc || del.delegado_usuario?.name ? (
                                                        <>
                                                            <span className="font-semibold text-zinc-600 dark:text-zinc-300">Cuenta del delegado:</span>{' '}
                                                            {del.delegado_usuario.rfc && (
                                                                <span className="font-mono">{del.delegado_usuario.rfc}</span>
                                                            )}
                                                            {del.delegado_usuario.rfc && del.delegado_usuario.name ? ' · ' : ''}
                                                            {del.delegado_usuario.name && <span>{del.delegado_usuario.name}</span>}
                                                        </>
                                                    ) : del.delegado_nombre ? (
                                                        <>
                                                            <span className="font-semibold text-zinc-600 dark:text-zinc-300">Delegado (catálogo):</span>{' '}
                                                            {del.delegado_nombre}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-zinc-400">Delegado sin cuenta vinculada</span>
                                                            {del.delegado_id != null && (
                                                                <span className="text-zinc-400"> · registro #{del.delegado_id}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end shrink-0">
                                            <button
                                                type="button"
                                                disabled={pdfLoteLoadingId === del.id || loadingEmpleados}
                                                onClick={() => downloadAcusesPdfLote(del.id, del.clave)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
                                                title="Un solo PDF con el acuse de todos los colaboradores"
                                            >
                                                {pdfLoteLoadingId === del.id ? (
                                                    <span className="size-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" aria-hidden />
                                                ) : (
                                                    <FileDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
                                                )}
                                                PDF todos
                                            </button>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-md border border-zinc-200/60 dark:border-zinc-700/50">
                                                {del.trabajadores_count} colaboradores
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(del.id)}
                                                className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/30"
                                                aria-label={abierta ? 'Contraer lista' : 'Expandir lista'}
                                            >
                                                {abierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {abierta && (
                                        <div>
                                            <DataTable
                                                columns={buildColumns(del.id)}
                                                data={empleados}
                                                loading={loadingEmpleados}
                                                emptyMessage={search.trim() ? 'No se encontraron coincidencias.' : 'No hay colaboradores asignados.'}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <CrearUsuarioEmpleadoModal
                empleado={crearUsuarioCtx?.empleado ?? null}
                delegacionId={crearUsuarioCtx?.delegacionId ?? null}
                onClose={() => setCrearUsuarioCtx(null)}
                onCreated={(res, meta) => {
                    if (res?.user && meta?.delegacionId != null && meta?.empleadoId != null) {
                        aplicarUsuarioCreado(meta.delegacionId, meta.empleadoId, res.user);
                    }
                    if (res?.message) setSuccessFlash(res.message);
                }}
            />
        </div>
    );
}
