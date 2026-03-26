import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Shirt, AlertCircle, Plus, FileDown, CheckCircle } from 'lucide-react';
import { api, resolveApiUrl } from '../lib/api';
import { Modal, SearchInput, FilterSelectShell, FilterToolbar, FilterToolbarRow } from '../components/ui';
import { useDebounce } from '../lib/useDebounce';

import {
    mergedRow,
    rowsEquivalent,
    displayItem,
    listarPrendasConTallaPendiente,
    importeLineaVestuario,
    importeTotalLineasNuevasPendientes,
    Toast,
    ModalCantidad,
    PrendaCard,
    ModalTalla,
    ModalCambiarProducto,
    ModalAgregarLineaVestuario,
    VestuarioResumenTotales,
} from '../features/vestuario/VestuarioEditorShared';

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function MiVestuarioPage() {
    const [data, setData] = useState(null);
    const [baseline, setBaseline] = useState([]);
    const [pendingEdits, setPendingEdits] = useState({});
    const [pendingNuevasLineas, setPendingNuevasLineas] = useState([]);
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [savingBatch, setSavingBatch] = useState(false);
    const [tallaBloqueo, setTallaBloqueo] = useState(null);
    const [anio, setAnio] = useState(null);

    const [editTalla, setEditTalla] = useState(null);
    const [cambiarProd, setCambiarProd] = useState(null);
    const [editCantidad, setEditCantidad] = useState(null);
    const [filterSearch, setFilterSearch] = useState('');
    const debouncedFilter = useDebounce(filterSearch, 250);
    const [periodoActivo, setPeriodoActivo] = useState(null);
    const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
    /** Tras guardar: mensaje de éxito + recibo PDF hasta que cargue `edicion_cerrada` o unos segundos */
    const [recienGuardadoRecibo, setRecienGuardadoRecibo] = useState(false);

    const load = useCallback((anioParam) => {
        setLoading(true);
        setApiError(null);
        const url = anioParam ? `/api/mi-vestuario?anio=${anioParam}` : '/api/mi-vestuario';
        api.get(url)
            .then(res => {
                if (res && typeof res === 'object' && 'empleado' in res) {
                    setData(res);
                    setBaseline((res.asignaciones ?? []).map((a) => ({ ...a })));
                    setPendingEdits({});
                    setPendingNuevasLineas([]);
                    setPeriodoActivo(res.periodo_activo ?? null);
                    if (!anioParam && res.anio) setAnio(res.anio);
                } else {
                    setApiError('session');
                    setData(null);
                }
            })
            .catch(err => {
                console.error('[MiVestuario] API error:', err.status, err.message);
                if (err.status === 401 || err.status === 403) {
                    setApiError('session');
                } else {
                    setApiError(err.message || 'Error al cargar vestuario');
                }
                setData(null);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!recienGuardadoRecibo) return undefined;
        const t = setTimeout(() => setRecienGuardadoRecibo(false), 15000);
        return () => clearTimeout(t);
    }, [recienGuardadoRecibo]);

    const abrirPdfReciboAcuse = useCallback((anioPdf) => {
        const y = Number(anioPdf);
        const q = Number.isFinite(y) && y >= 2000 && y <= 2100 ? `?anio=${y}` : '';
        const url = resolveApiUrl(`/api/mi-vestuario/acuse-pdf${q}`);
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleAnioChange = (newAnio) => {
        setAnio(newAnio);
        load(newAnio);
    };

    const showToast = (msg) => setToast(msg);

    const upsertPending = useCallback((seleccionId, partial) => {
        setPendingEdits((prev) => {
            const b = baseline.find((x) => x.id === seleccionId);
            if (!b) return prev;
            const cur = { ...(prev[seleccionId] || {}), ...partial };
            if (rowsEquivalent(b, cur)) {
                const next = { ...prev };
                delete next[seleccionId];
                return next;
            }
            return { ...prev, [seleccionId]: cur };
        });
    }, [baseline]);

    const handleApplyTalla = (talla) => {
        if (!editTalla) return;
        const t = String(talla ?? '').trim().toUpperCase();
        if (editTalla._nuevaLinea) {
            setPendingNuevasLineas((prev) => prev.map((n) => (n.clientKey === editTalla.id ? { ...n, talla: t } : n)));
        } else {
            upsertPending(editTalla.id, { talla: t });
        }
        setEditTalla(null);
    };

    const handleApplyProducto = (selected, tallaStr) => {
        if (!cambiarProd || !selected) return;
        const t = String(tallaStr ?? '').trim().toUpperCase();
        const sid = cambiarProd.id;
        setPendingEdits((prev) => {
            const b = baseline.find((x) => x.id === sid);
            if (!b) return prev;
            const prevPatch = prev[sid] || {};
            const cur = {
                ...prevPatch,
                producto_id: selected.id,
                descripcion: selected.descripcion,
                clave_vestuario: selected.clave_vestuario ?? selected.codigo,
                precio_unitario: selected.precio_unitario != null ? selected.precio_unitario : null,
            };
            if (t) cur.talla = t;
            else delete cur.talla;

            if (rowsEquivalent(b, cur)) {
                const next = { ...prev };
                delete next[sid];
                return next;
            }
            return { ...prev, [sid]: cur };
        });
        setCambiarProd(null);
    };

    const handleApplyCantidad = (cantidad) => {
        if (!editCantidad) return;
        const n = Math.max(1, parseInt(cantidad, 10) || 1);
        if (editCantidad._nuevaLinea) {
            setPendingNuevasLineas((prev) => prev.map((row) => (row.clientKey === editCantidad.id ? { ...row, cantidad: n } : row)));
        } else {
            upsertPending(editCantidad.id, { cantidad: n });
        }
        setEditCantidad(null);
    };

    const handleAdjustCantidad = useCallback((item, delta) => {
        if (item._nuevaLinea) {
            setPendingNuevasLineas((prev) => prev.map((n) => {
                if (n.clientKey !== item.id) return n;
                const cur = Number(n.cantidad) || 1;
                const next = Math.min(100, Math.max(1, cur + delta));
                return { ...n, cantidad: next };
            }));
            return;
        }
        const cur = Number(item.cantidad) || 1;
        const next = Math.min(100, Math.max(1, cur + delta));
        upsertPending(item.id, { cantidad: next });
    }, [upsertPending]);

    const pendingCount = Object.keys(pendingEdits).length;
    const pendingCountCombined = pendingCount + pendingNuevasLineas.length;

    const importeBaselineTotal = useMemo(
        () => baseline.reduce((s, o) => s + importeLineaVestuario(o, null), 0),
        [baseline]
    );
    const importeConCambiosPendientes = useMemo(
        () => baseline.reduce((s, o) => s + importeLineaVestuario(o, pendingEdits[o.id]), 0),
        [baseline, pendingEdits]
    );
    const importeNuevasPendientes = useMemo(
        () => importeTotalLineasNuevasPendientes(pendingNuevasLineas),
        [pendingNuevasLineas]
    );
    const saldoDisponibleNuevaLinea = importeBaselineTotal - importeConCambiosPendientes - importeNuevasPendientes;
    const puedeAgregarOtraLinea = (importeBaselineTotal <= 0) || saldoDisponibleNuevaLinea > 0.01;

    const partidasCatalogoUi = useMemo(() => {
        const fromApi = data?.partidas_catalogo;
        if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi.map((p) => Number(p));
        const u = new Set();
        baseline.forEach((r) => { if (r.partida != null) u.add(Number(r.partida)); });
        return [...u].sort((a, b) => a - b);
    }, [data?.partidas_catalogo, baseline]);

    const aniosSelect = useMemo(() => {
        const disp = (data?.anios_disponibles ?? []).map((x) => Number(x)).filter((n) => !Number.isNaN(n));
        const vig = Number(data?.ejercicio_vigente ?? new Date().getFullYear());
        const merged = Number.isNaN(vig) ? disp : [vig, ...disp];
        return [...new Set(merged)].sort((a, b) => b - a);
    }, [data?.anios_disponibles, data?.ejercicio_vigente]);

    const ejercicioVigente = data?.ejercicio_vigente ?? new Date().getFullYear();
    const anioCatalogo = ejercicioVigente;

    const asignacionesMerged = useMemo(() => {
        const rows = data?.asignaciones ?? [];
        return rows.map((row) => {
            const b = baseline.find((x) => x.id === row.id) ?? row;
            return displayItem(b, pendingEdits[row.id]);
        });
    }, [data?.asignaciones, baseline, pendingEdits]);

    const asignaciones = asignacionesMerged.filter((a) =>
        debouncedFilter
            ? a.descripcion.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
            (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
            : true
    );

    const filasNuevasPendientes = useMemo(() => pendingNuevasLineas.map((n) => ({
        id: n.clientKey,
        _nuevaLinea: true,
        partida: n.partida,
        descripcion: n.descripcion,
        clave_vestuario: n.clave_vestuario,
        talla: n.talla,
        cantidad: n.cantidad,
        precio_unitario: n.precio_unitario,
        _pendiente: true,
    })), [pendingNuevasLineas]);

    const nuevasFiltradas = useMemo(() => filasNuevasPendientes.filter((a) =>
        debouncedFilter
            ? (a.descripcion || '').toLowerCase().includes(debouncedFilter.toLowerCase()) ||
            (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
            : true
    ), [filasNuevasPendientes, debouncedFilter]);

    const listadoGrid = useMemo(() => [...asignaciones, ...nuevasFiltradas], [asignaciones, nuevasFiltradas]);
    const asignacionesParaTotales = useMemo(() => [...asignacionesMerged, ...filasNuevasPendientes], [asignacionesMerged, filasNuevasPendientes]);

    const confirmarCambios = async () => {
        if (pendingCountCombined === 0) return;

        const ejercicioVigenteLocal = data?.ejercicio_vigente ?? new Date().getFullYear();
        const viendoHistoricoLocal = (anio ?? data?.anio) !== ejercicioVigenteLocal;
        const puedeEditarLocal = data?.puede_editar_vestuario ?? false;

        if (puedeEditarLocal && !viendoHistoricoLocal) {
            const fallosTalla = listarPrendasConTallaPendiente(
                data?.asignaciones ?? [],
                baseline,
                pendingEdits,
                pendingNuevasLineas
            );
            if (fallosTalla.length > 0) {
                setTallaBloqueo(fallosTalla);
                return;
            }
        }

        const cambios = [];
        for (const idStr of Object.keys(pendingEdits)) {
            const origIdKey = Number(idStr);
            const orig = baseline.find((x) => x.id === origIdKey);
            const patch = pendingEdits[idStr];
            if (!orig || !patch) continue;
            const m = mergedRow(orig, patch);
            let didProducto = false;
            if (patch.producto_id != null && patch.producto_id !== orig.producto_id) {
                const entry = {
                    seleccion_id: origIdKey,
                    tipo: 'producto',
                    producto_id: patch.producto_id,
                };
                const tallaTrim = String(m.talla ?? '').trim();
                if (tallaTrim) entry.talla = tallaTrim;
                cambios.push(entry);
                didProducto = true;
            }
            if (!didProducto && String(m.talla ?? '') !== String(orig.talla ?? '')) {
                cambios.push({
                    seleccion_id: origIdKey,
                    tipo: 'talla',
                    talla: m.talla,
                });
            }
            if (Number(m.cantidad) !== Number(orig.cantidad)) {
                cambios.push({
                    seleccion_id: origIdKey,
                    tipo: 'cantidad',
                    cantidad: m.cantidad,
                });
            }
        }
        for (const n of pendingNuevasLineas) {
            cambios.push({
                tipo: 'nueva_linea',
                producto_id: n.producto_id,
                talla: String(n.talla ?? '').trim(),
                cantidad: Math.max(1, Math.min(100, Number(n.cantidad) || 1)),
            });
        }
        if (cambios.length === 0) return;

        setSavingBatch(true);
        try {
            const res = await api.post('/api/mi-vestuario/guardar-cambios', { cambios });
            setRecienGuardadoRecibo(true);
            showToast(res?.message ?? 'Tu vestuario quedó registrado.');
            setPendingEdits({});
            setPendingNuevasLineas([]);
            load(anio ?? data?.anio);
        } catch (err) {
            alert(err.message || 'No se pudieron guardar los cambios.');
        } finally {
            setSavingBatch(false);
        }
    };

    const descartarPendientes = () => {
        if (pendingCountCombined === 0) return;
        if (!window.confirm('¿Descartar todos los cambios pendientes (incluidas líneas nuevas)?')) return;
        setPendingEdits({});
        setPendingNuevasLineas([]);
    };


    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <span className="size-7 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
        </div>
    );

    /* ── Error de sesión / API ── */
    if (apiError) return (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="size-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Shirt size={28} className="text-amber-400" strokeWidth={1.3} />
            </div>
            <div className="text-center max-w-sm">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {apiError === 'session' ? 'Sesión expirada' : 'Error al cargar'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    {apiError === 'session'
                        ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
                        : apiError}
                </p>
            </div>
            <div className="flex gap-3">
                <button onClick={load}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                    Reintentar
                </button>
                {apiError === 'session' && (
                    <a href="/login"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 transition-all">
                        Iniciar sesión
                    </a>
                )}
            </div>
        </div>
    );

    /* ── Sin NUE vinculado ── */
    if (!data?.empleado) return (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Shirt size={28} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.3} />
            </div>
            <div className="text-center max-w-sm">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">NUE no vinculado</p>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Para ver tu vestuario necesitas vincular tu NUE (Número Único de Empleado).
                    Ve a <strong className="text-zinc-700 dark:text-zinc-300">Mi Cuenta</strong> e ingresa tu NUE en la sección correspondiente.
                </p>
            </div>
            <a href="/dashboard/mi-cuenta"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 transition-all">
                Ir a Mi Cuenta
            </a>
        </div>
    );

    const puedeEditar = data?.puede_editar_vestuario ?? false;
    const edicionCerrada = data?.edicion_cerrada_ejercicio_vigente ?? false;
    const viendoHistorico = (anio ?? data.anio) !== ejercicioVigente;
    const anioVista = anio ?? data.anio;
    const mostrarBloqueRecibo =
        data?.empleado
        && anioVista === ejercicioVigente
        && (edicionCerrada || recienGuardadoRecibo);

    return (
        <div className={pendingCountCombined > 0 && puedeEditar ? 'pb-6 md:pb-24' : ''}>
            <div className="mb-4">
                <div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-xl">
                        Mi Vestuario
                    </h2>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 sm:text-[12px]">
                        <span className="shrink-0">NUE {data.empleado.nue}</span>
                        <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                            ·
                        </span>
                        <span className="min-w-0 max-w-full truncate sm:max-w-[200px]">{data.empleado.delegacion_clave}</span>
                    </div>
                </div>

                <FilterToolbar className="mt-3">
                    <SearchInput
                        id="mi-vestuario-busqueda"
                        label="Filtrar artículos"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Nombre o clave…"
                    />
                    <FilterToolbarRow>
                        {aniosSelect.length > 1 ? (
                            <FilterSelectShell id="mi-vestuario-anio" label="Ejercicio" icon={Calendar} className="min-w-0 sm:w-[9.5rem]">
                                <select
                                    id="mi-vestuario-anio"
                                    value={anio ?? data.anio}
                                    onChange={(e) => handleAnioChange(Number(e.target.value))}
                                    aria-label="Año del vestuario"
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                >
                                    {aniosSelect.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </FilterSelectShell>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ejercicio</span>
                                <span className="text-[12px] font-bold text-brand-gold">{anio ?? data.anio}</span>
                            </div>
                        )}
                        {(anio ?? data.anio) === ejercicioVigente && (
                            <span className="rounded border border-brand-gold/25 bg-brand-gold/5 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-brand-gold">
                                Vigente
                            </span>
                        )}
                        {(anio ?? data.anio) !== ejercicioVigente && (
                            <span className="rounded bg-zinc-100 px-1.5 py-0 text-[9px] font-semibold text-zinc-500 dark:bg-zinc-800">histórico</span>
                        )}
                    </FilterToolbarRow>
                </FilterToolbar>

                <div className="mt-3">
                    <VestuarioResumenTotales
                        variant="header"
                        asignacionesMerged={asignacionesParaTotales}
                        mostrandoFiltrados={Boolean(debouncedFilter?.trim())}
                        totalFiltrados={listadoGrid.length}
                    />
                </div>

                {mostrarBloqueRecibo && (
                    <div
                        className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
                        role="status"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                                <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-brand-gold" strokeWidth={2} aria-hidden />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                                        Tu vestuario quedó registrado.
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Recibo de selección del ejercicio vigente. Consérvalo o compártelo si te lo solicitan.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => abrirPdfReciboAcuse(ejercicioVigente)}
                                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:w-auto touch-manipulation"
                            >
                                <FileDown className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                                PDF
                            </button>
                        </div>
                    </div>
                )}

                {puedeEditar && (anio ?? data.anio) === ejercicioVigente && (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => setModalAgregarOpen(true)}
                            disabled={!puedeAgregarOtraLinea}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-brand-gold/35 bg-brand-gold/10 px-3 py-2 text-[11px] font-bold text-brand-gold transition-colors hover:bg-brand-gold/20 disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                            Agregar otro artículo (otra partida)
                        </button>
                        {!puedeAgregarOtraLinea && importeBaselineTotal > 0 ? (
                            <p className="mt-1.5 max-w-xl text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                                Para agregar una línea nueva, libere importe bajando cantidades u optando por artículos más baratos en sus tarjetas actuales.
                            </p>
                        ) : null}
                    </div>
                )}

                {data.vista_hereda_anio_anterior && data.anio_referencia_vista != null && (
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-[12px] leading-snug text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        <p className="mb-1 flex flex-wrap items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                            Actualiza tu vestuario al ejercicio {ejercicioVigente}
                            {periodoActivo?.fecha_fin && (
                                <span className="text-[11px] bg-brand-gold/15 dark:bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    Límite: {(() => { const f = periodoActivo.fecha_fin; const d = new Date(f?.length === 10 ? f + 'T00:00:00' : f); return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); })()}
                                </span>
                            )}
                        </p>
                        <p>
                            Lo que ves ahora son tus productos del ejercicio <strong className="text-zinc-900 dark:text-white">{data.anio_referencia_vista}</strong>
                            {' '}(precios y claves de ese año). Necesitas revisarlos y guardar los cambios para registrarlos en el ejercicio <strong className="text-zinc-900 dark:text-white">{ejercicioVigente}</strong>
                            {' '}con el catálogo actual. Al cambiar de artículo, el listado usa precios y claves del ejercicio vigente.
                        </p>
                    </div>
                )}
            </div>

            {listadoGrid.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                    <Shirt size={28} className="text-zinc-200 dark:text-zinc-700" strokeWidth={1.2} />
                    <p className="text-[11px] text-zinc-400">
                        {filterSearch ? 'Sin resultados para ese filtro.' : `Sin asignaciones para el ejercicio ${data.anio}.`}
                    </p>
                </div>
            ) : (
                <div className="grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {listadoGrid.map((item) => (
                        <PrendaCard
                            key={item.id}
                            item={item}
                            cantidadBaseline={item._nuevaLinea ? undefined : baseline.find((x) => x.id === item.id)?.cantidad}
                            editable={puedeEditar}
                            onEditTalla={setEditTalla}
                            onCambiarProducto={setCambiarProd}
                            onEditCantidad={setEditCantidad}
                            onAdjustCantidad={handleAdjustCantidad}
                            onRemoveNuevaLinea={item._nuevaLinea ? (key) => {
                                setPendingNuevasLineas((prev) => prev.filter((n) => n.clientKey !== key));
                            } : undefined}
                        />
                    ))}
                </div>
            )}

            {pendingCountCombined > 0 && puedeEditar && (
                <div
                    className="z-40 max-md:mt-10 max-md:rounded-2xl max-md:border max-md:border-zinc-200 dark:max-md:border-zinc-700 max-md:shadow-sm dark:max-md:shadow-none bg-white dark:bg-zinc-950 md:fixed md:bottom-0 md:left-0 md:right-0 md:border-t md:border-zinc-200 md:dark:border-zinc-800 md:shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-1.5">
                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" strokeWidth={2} />
                            <div className="min-w-0">
                                <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-100">
                                    {pendingCountCombined === 1 ? '1 cambio pendiente' : `${pendingCountCombined} cambios pendientes`}
                                </p>
                                <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                                    Revisa las tarjetas marcadas. Al guardar se cierra tu edición para el ejercicio vigente (el delegado puede reactivarla si hubo un error).
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={descartarPendientes}
                                disabled={savingBatch}
                                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                            >
                                Descartar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarCambios}
                                disabled={savingBatch}
                                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                            >
                                {savingBatch ? 'Guardando…' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalTalla item={editTalla} onClose={() => setEditTalla(null)} onApply={handleApplyTalla} />
            <ModalCambiarProducto
                item={cambiarProd}
                anioCatalogo={anioCatalogo}
                baseline={baseline}
                pendingEdits={pendingEdits}
                importeLineasNuevasPendientes={importeNuevasPendientes}
                onClose={() => setCambiarProd(null)}
                onApply={handleApplyProducto}
            />
            <ModalAgregarLineaVestuario
                open={modalAgregarOpen}
                onClose={() => setModalAgregarOpen(false)}
                anioCatalogo={anioCatalogo}
                partidasCatalogo={partidasCatalogoUi}
                saldoImporteDisponible={importeBaselineTotal > 0 ? saldoDisponibleNuevaLinea : null}
                onApply={(payload) => {
                    const clientKey = `nueva-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                    setPendingNuevasLineas((prev) => [...prev, { ...payload, clientKey }]);
                    setModalAgregarOpen(false);
                }}
            />
            <ModalCantidad
                item={editCantidad}
                cantidadOriginal={editCantidad && !editCantidad._nuevaLinea ? baseline.find((x) => x.id === editCantidad.id)?.cantidad : undefined}
                onClose={() => setEditCantidad(null)}
                onApply={handleApplyCantidad}
            />

            <Modal
                open={Array.isArray(tallaBloqueo) && tallaBloqueo.length > 0}
                onClose={() => setTallaBloqueo(null)}
                title="Revisa la talla antes de guardar"
                size="md"
                footer={
                    <button
                        type="button"
                        onClick={() => setTallaBloqueo(null)}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90"
                    >
                        Entendido
                    </button>
                }
            >
                <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                    No se puede guardar todavía. Corrige estas prendas y vuelve a intentar:
                </p>
                <ul className="space-y-2.5 max-h-[min(50vh,320px)] overflow-y-auto pr-1">
                    {tallaBloqueo?.map((f, i) => (
                        <li
                            key={i}
                            className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/25 px-3.5 py-3"
                        >
                            <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-100 leading-snug">{f.descripcion}</p>
                            <p className="text-[10px] font-mono text-zinc-500 mt-1">Clave: {f.clave}</p>
                            <p className="text-[11px] text-amber-900 dark:text-amber-200/90 mt-2 font-medium leading-snug">{f.motivo}</p>
                        </li>
                    ))}
                </ul>
            </Modal>

            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
