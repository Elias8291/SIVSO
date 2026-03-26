import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, ChevronDown, ChevronUp, FileText, KeyRound, ListFilter } from 'lucide-react';
import { DataTable, SearchInput, Modal } from '../components/ui';
import { api, resolveApiUrl } from '../lib/api';
import CrearUsuarioEmpleadoModal from '../features/mi-delegacion/CrearUsuarioEmpleadoModal';

/** Contenedor de select con el mismo lenguaje visual que SearchInput */
function FilterSelectShell({ id, label, icon: Icon, locked, className = 'sm:w-[11.25rem]', children }) {
    return (
        <div className={`w-full min-w-0 shrink-0 ${className}`}>
            <label
                htmlFor={id}
                className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400"
            >
                {label}
            </label>
            <div
                className={`flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:shadow-[0_0_0_1px_rgba(175,148,96,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-brand-gold/35 sm:px-3 sm:py-2 ${locked ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <Icon className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500 pointer-events-none" strokeWidth={1.6} aria-hidden />
                {children}
            </div>
        </div>
    );
}

export default function MiDelegacionPage() {
    const [delegaciones, setDelegaciones] = useState([]);
    const [empleadosPorDelegacion, setEmpleadosPorDelegacion] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [successFlash, setSuccessFlash] = useState(null);
    const [search, setSearch] = useState('');
    const [crearUsuarioCtx, setCrearUsuarioCtx] = useState(null);
    const [expandidas, setExpandidas] = useState({});
    /** Año sugerido (periodo activo o año calendario) para abrir el modal de PDF */
    const [anioPreferidoPdf, setAnioPreferidoPdf] = useState(() => new Date().getFullYear());
    /** Modal: elegir ejercicio antes de abrir el PDF */
    const [pdfModal, setPdfModal] = useState(null);
    /** Año elegido en el modal (opciones = años con selecciones en BD) */
    const [anioEnModal, setAnioEnModal] = useState(() => new Date().getFullYear());
    const [aniosModalPdf, setAniosModalPdf] = useState([]);
    const [aniosModalPdfLoading, setAniosModalPdfLoading] = useState(false);
    const [aniosModalPdfError, setAniosModalPdfError] = useState(null);
    /** 'todas' | id numérico como string */
    const [filtroDelegacion, setFiltroDelegacion] = useState('todas');
    /** todos | actualizado | pendiente */
    const [filtroEstadoVestuario, setFiltroEstadoVestuario] = useState('todos');
    /** todos | con_cuenta | sin_cuenta */
    const [filtroAcceso, setFiltroAcceso] = useState('todos');

    const toggleExpand = (id) => setExpandidas((p) => ({ ...p, [id]: !p[id] }));

    const delegacionesVisibles = useMemo(() => {
        if (delegaciones.length <= 1 || filtroDelegacion === 'todas') return delegaciones;
        const id = Number(filtroDelegacion);
        return delegaciones.filter((d) => d.id === id);
    }, [delegaciones, filtroDelegacion]);

    const filtrosActivos =
        filtroDelegacion !== 'todas'
        || filtroEstadoVestuario !== 'todos'
        || filtroAcceso !== 'todos'
        || search.trim() !== '';

    const limpiarFiltros = () => {
        setFiltroDelegacion('todas');
        setFiltroEstadoVestuario('todos');
        setFiltroAcceso('todos');
        setSearch('');
    };

    const openAcusePdfConAnio = (empleadoId, anio) => {
        const n = Number(anio);
        const qs = Number.isFinite(n) && n >= 2000 && n <= 2100 ? `?anio=${n}` : '';
        const url = resolveApiUrl(`/api/mi-delegacion/empleados/${empleadoId}/acuse-pdf${qs}`);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    /** Abre el PDF de todos en una pestaña: visor nativo (scroll, zoom, guardar). */
    const openAcusesPdfLote = (delegacionId, anioEjercicio) => {
        setMessage(null);
        const anio = Number(anioEjercicio);
        const q = new URLSearchParams();
        if (Number.isFinite(anio) && anio >= 2000 && anio <= 2100) {
            q.set('anio', String(anio));
        }
        const qs = q.toString();
        const url = resolveApiUrl(
            `/api/mi-delegacion/delegaciones/${delegacionId}/acuses-pdf${qs ? `?${qs}` : ''}`
        );
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (!w) {
            setMessage('Permita ventanas emergentes para ver el PDF en pantalla completa y guardarlo desde el visor.');
        }
    };

    useEffect(() => {
        api.get('/api/periodos/activo')
            .then((r) => {
                const anio = r.data?.anio;
                if (typeof anio === 'number' && anio >= 2000 && anio <= 2100) {
                    setAnioPreferidoPdf(anio);
                }
            })
            .catch(() => {
                /* sin permiso o sin periodo: se mantiene el año en estado inicial */
            });
    }, []);

    const abrirModalPdfLote = (delegacionId, clave) => {
        setPdfModal({ type: 'lote', delegacionId, clave });
    };

    const abrirModalPdfIndividual = (empleadoId) => {
        setPdfModal({ type: 'individual', empleadoId });
    };

    const confirmarModalPdf = () => {
        if (!pdfModal) return;
        if (aniosModalPdfLoading || aniosModalPdf.length === 0) return;
        const anio = Number(anioEnModal);
        if (!aniosModalPdf.includes(anio)) return;
        const m = pdfModal;
        setPdfModal(null);
        if (m.type === 'lote') {
            openAcusesPdfLote(m.delegacionId, anio);
        } else {
            openAcusePdfConAnio(m.empleadoId, anio);
        }
    };

    useEffect(() => {
        if (!pdfModal) {
            setAniosModalPdf([]);
            setAniosModalPdfError(null);
            return;
        }
        let cancelled = false;
        setAniosModalPdfLoading(true);
        setAniosModalPdfError(null);
        const url =
            pdfModal.type === 'lote'
                ? `/api/mi-delegacion/delegaciones/${pdfModal.delegacionId}/anios-acuse-pdf`
                : `/api/mi-delegacion/empleados/${pdfModal.empleadoId}/anios-acuse-pdf`;
        api.get(url)
            .then((json) => {
                if (cancelled) return;
                const raw = json?.anios ?? [];
                const anios = [...new Set(raw.map((y) => Number(y)).filter((n) => n >= 2000 && n <= 2100))].sort((a, b) => b - a);
                setAniosModalPdf(anios);
                if (anios.length > 0) {
                    const prefer = anioPreferidoPdf;
                    setAnioEnModal(anios.includes(prefer) ? prefer : anios[0]);
                }
            })
            .catch((err) => {
                if (!cancelled) setAniosModalPdfError(err.message || 'No se pudieron cargar los ejercicios.');
            })
            .finally(() => {
                if (!cancelled) setAniosModalPdfLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [pdfModal, anioPreferidoPdf]);

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

    useEffect(() => {
        if (filtroDelegacion === 'todas') return;
        const id = Number(filtroDelegacion);
        if (!delegaciones.some((d) => d.id === id)) {
            setFiltroDelegacion('todas');
        }
    }, [delegaciones, filtroDelegacion]);

    const aplicarFiltrosColaboradores = (trabajadores) => {
        let rows = trabajadores ?? [];
        const q = search.trim().toLowerCase();
        if (q) {
            rows = rows.filter(
                (t) =>
                    (t.nombre_completo || '').toLowerCase().includes(q) ||
                    (t.nue || '').toLowerCase().includes(q) ||
                    (t.delegacion || '').toLowerCase().includes(q)
            );
        }
        if (filtroEstadoVestuario === 'actualizado') {
            rows = rows.filter((t) => t.actualizado);
        } else if (filtroEstadoVestuario === 'pendiente') {
            rows = rows.filter((t) => !t.actualizado);
        }
        if (filtroAcceso === 'con_cuenta') {
            rows = rows.filter((t) => Boolean(t.user_id));
        } else if (filtroAcceso === 'sin_cuenta') {
            rows = rows.filter((t) => !t.user_id);
        }
        return rows;
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
                <div className="min-w-0">
                    <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide leading-snug break-words">{val}</p>
                    <p className="text-[11px] text-zinc-400 mt-1.5 font-mono leading-snug break-all">NUE: {row.nue ?? '—'}</p>
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
            label: 'Acciones',
            tdClass: 'align-top',
            render: (_, row) => (
                <div className="flex flex-col gap-2 w-full max-w-full md:flex-row md:flex-wrap md:justify-end md:gap-2">
                    {!row.user_id && (
                        <button
                            type="button"
                            onClick={() => setCrearUsuarioCtx({ empleado: row, delegacionId })}
                            className="w-full md:w-auto inline-flex justify-center px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            Crear acceso
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => abrirModalPdfIndividual(row.id)}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        title="Acuse de recibo (PDF)"
                    >
                        <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />
                        PDF
                    </button>
                    <Link
                        to={`/dashboard/mi-delegacion/vestuario/${row.id}`}
                        className="w-full md:w-auto inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider border border-brand-gold/20 hover:bg-brand-gold hover:text-white transition-all"
                    >
                        Ver vestuario
                    </Link>
                </div>
            )
        }
    ];

    return (
        <div className="relative">
            {/* Filtros: mismo criterio que SearchInput (contenedor, foco, tipografía) */}
            <div className="mb-8 space-y-5">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        Mi Delegación
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-2xl">
                        Busque y filtre colaboradores. Al abrir un PDF (individual o de todos), podrá elegir el ejercicio; el de todos se abre en una pestaña para verlo completo y guardarlo desde el visor.
                    </p>
                </div>

                <div className="max-w-4xl space-y-4">
                    <SearchInput
                        label="Buscar colaborador"
                        placeholder="Nombre o NUE…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3 min-w-0 flex-1">
                            {delegaciones.length > 1 ? (
                                <FilterSelectShell id="mi-del-filtro-del" label="Delegación" icon={Building2} locked={false}>
                                    <select
                                        id="mi-del-filtro-del"
                                        value={filtroDelegacion}
                                        onChange={(e) => setFiltroDelegacion(e.target.value)}
                                        className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                    >
                                        <option value="todas">Todas</option>
                                        {delegaciones.map((d) => (
                                            <option key={d.id} value={String(d.id)}>{d.clave}</option>
                                        ))}
                                    </select>
                                </FilterSelectShell>
                            ) : null}

                            <FilterSelectShell id="mi-del-filtro-estado" label="Estado vestuario" icon={ListFilter} locked={false}>
                                <select
                                    id="mi-del-filtro-estado"
                                    value={filtroEstadoVestuario}
                                    onChange={(e) => setFiltroEstadoVestuario(e.target.value)}
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="actualizado">Actualizado</option>
                                    <option value="pendiente">Pendiente</option>
                                </select>
                            </FilterSelectShell>

                            <FilterSelectShell id="mi-del-filtro-acceso" label="Acceso sistema" icon={KeyRound} locked={false}>
                                <select
                                    id="mi-del-filtro-acceso"
                                    value={filtroAcceso}
                                    onChange={(e) => setFiltroAcceso(e.target.value)}
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                >
                                    <option value="todos">Todos</option>
                                    <option value="con_cuenta">Con cuenta</option>
                                    <option value="sin_cuenta">Sin cuenta</option>
                                </select>
                            </FilterSelectShell>
                        </div>

                        {filtrosActivos ? (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:border-brand-gold/30 hover:bg-brand-gold/5 hover:text-brand-gold dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-brand-gold/40"
                            >
                                Limpiar filtros
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

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
                    {successFlash && (
                        <div className="px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-[12px] text-emerald-800 dark:text-emerald-200 mb-6">
                            {successFlash}
                        </div>
                    )}

                    <div className="space-y-8">
                        {delegacionesVisibles.map((del) => {
                            const empleados = aplicarFiltrosColaboradores(empleadosPorDelegacion[del.id]);
                            const loadingEmpleados = empleadosPorDelegacion[del.id] === undefined;
                            const abierta = expandidas[del.id] !== false;
                            const vacioPorFiltros =
                                !loadingEmpleados
                                && (empleadosPorDelegacion[del.id]?.length ?? 0) > 0
                                && empleados.length === 0;

                            return (
                                <div key={del.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 min-w-0 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex w-full min-w-0 flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
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
                                            className="flex items-start gap-2.5 min-w-0 w-full sm:flex-1 text-left rounded-lg -ml-1 sm:-ml-2 pl-1 sm:pl-2 py-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/30"
                                        >
                                            <span className="size-1.5 bg-brand-gold rounded-full shrink-0" />
                                            <div className="min-w-0">
                                                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                                                    Delegación {del.clave}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug break-words">
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
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end shrink-0 min-w-0">
                                            <button
                                                type="button"
                                                disabled={loadingEmpleados}
                                                onClick={() => abrirModalPdfLote(del.id, del.clave)}
                                                className="inline-flex flex-1 sm:flex-initial min-w-0 justify-center items-center gap-1.5 px-2.5 py-2 sm:py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
                                                title="Abre un PDF con todos los acuses en una pestaña (ver, imprimir o guardar)"
                                            >
                                                <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />
                                                PDF todos
                                            </button>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-md border border-zinc-200/60 dark:border-zinc-700/50">
                                                {(typeof del.trabajadores_count === 'number' && del.trabajadores_count > 0
                                                    ? del.trabajadores_count
                                                    : (Array.isArray(empleadosPorDelegacion[del.id]) && empleadosPorDelegacion[del.id].length > 0
                                                        ? empleadosPorDelegacion[del.id].length
                                                        : (del.trabajadores_count ?? 0)))}{' '}
                                                colaboradores
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
                                                emptyMessage={
                                                    vacioPorFiltros
                                                        ? 'Ningún colaborador coincide con los filtros actuales.'
                                                        : search.trim()
                                                            ? 'No se encontraron coincidencias.'
                                                            : 'No hay colaboradores asignados.'
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <Modal
                open={pdfModal != null}
                onClose={() => setPdfModal(null)}
                title={pdfModal?.type === 'lote' ? 'PDF de toda la delegación' : 'Acuse individual (PDF)'}
                size="sm"
                footer={(
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setPdfModal(null)}
                            className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmarModalPdf}
                            disabled={
                                aniosModalPdfLoading
                                || aniosModalPdf.length === 0
                                || aniosModalPdfError != null
                            }
                            className="min-h-[44px] rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                        >
                            {pdfModal?.type === 'lote' ? 'Ver PDF' : 'Abrir PDF'}
                        </button>
                    </div>
                )}
            >
                <p className="mb-4 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {pdfModal?.type === 'lote'
                        ? 'Solo se listan ejercicios en los que hay vestuario registrado para al menos un colaborador de la delegación.'
                        : 'Solo se listan ejercicios en los que este colaborador tiene selección de vestuario.'}
                </p>
                {aniosModalPdfLoading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                        <span className="size-8 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                        <span className="text-[13px] text-zinc-500">Cargando ejercicios…</span>
                    </div>
                ) : aniosModalPdfError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                        {aniosModalPdfError}
                    </p>
                ) : aniosModalPdf.length === 0 ? (
                    <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[13px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                        No hay vestuario registrado en ningún ejercicio; no se puede generar el PDF.
                    </p>
                ) : (
                    <FilterSelectShell
                        id="modal-pdf-anio"
                        label="Ejercicio del documento"
                        icon={Calendar}
                        locked={false}
                        className="w-full sm:w-full"
                    >
                        <select
                            id="modal-pdf-anio"
                            value={String(anioEnModal)}
                            onChange={(e) => setAnioEnModal(Number(e.target.value))}
                            className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-bold text-brand-gold outline-none dark:text-brand-gold"
                        >
                            {aniosModalPdf.map((y) => (
                                <option key={y} value={String(y)}>{y}</option>
                            ))}
                        </select>
                    </FilterSelectShell>
                )}
            </Modal>

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
