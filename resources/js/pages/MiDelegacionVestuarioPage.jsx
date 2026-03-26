/**
 * Vestuario de un colaborador desde Mi delegación — misma UX que Mi vestuario: cambios locales y un solo «Guardar cambios».
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Shirt, AlertCircle, ArrowLeft, Unlock, Plus } from 'lucide-react';
import { api } from '../lib/api';
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

export default function MiDelegacionVestuarioPage() {
    const { empleadoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const backPath = location.state?.from ?? '/dashboard/mi-delegacion';
    const backLabel = location.state?.fromLabel ?? 'Volver a Mi delegación';
    const idNum = empleadoId ? parseInt(empleadoId, 10) : NaN;

    const [data, setData] = useState(null);
    const [baseline, setBaseline] = useState([]);
    const [pendingEdits, setPendingEdits] = useState({});
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
    const [reactivando, setReactivando] = useState(false);
    const [pendingNuevasLineas, setPendingNuevasLineas] = useState([]);
    const [modalAgregarOpen, setModalAgregarOpen] = useState(false);

    const load = useCallback((anioParam) => {
        if (!idNum || Number.isNaN(idNum)) {
            setApiError('Colaborador no válido.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setApiError(null);
        const url = anioParam
            ? `/api/empleados/${idNum}/vestuario?anio=${anioParam}`
            : `/api/empleados/${idNum}/vestuario`;
        api.get(url)
            .then((res) => {
                if (res && typeof res === 'object' && res.empleado) {
                    setData(res);
                    setBaseline((res.asignaciones ?? []).map((a) => ({ ...a })));
                    setPendingEdits({});
                    setPendingNuevasLineas([]);
                    setPeriodoActivo(res.periodo_activo ?? null);
                    if (!anioParam && res.anio != null) setAnio(res.anio);
                } else {
                    setApiError('Respuesta inválida del servidor.');
                    setData(null);
                }
            })
            .catch((err) => {
                if (err.status === 401 || err.status === 403) {
                    setApiError(err.message || 'No tiene permiso para ver este vestuario.');
                } else {
                    setApiError(err.message || 'Error al cargar vestuario');
                }
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [idNum]);

    useEffect(() => {
        load();
    }, [load]);

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
            ? (a.descripcion || '').toLowerCase().includes(debouncedFilter.toLowerCase())
            || (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
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
            ? (a.descripcion || '').toLowerCase().includes(debouncedFilter.toLowerCase())
            || (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
            : true
    ), [filasNuevasPendientes, debouncedFilter]);

    const listadoGrid = useMemo(() => [...asignaciones, ...nuevasFiltradas], [asignaciones, nuevasFiltradas]);
    const asignacionesParaTotales = useMemo(() => [...asignacionesMerged, ...filasNuevasPendientes], [asignacionesMerged, filasNuevasPendientes]);

    const confirmarCambios = async () => {
        if (pendingCountCombined === 0 || !idNum) return;

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
            const res = await api.post(`/api/empleados/${idNum}/vestuario/guardar-cambios`, { cambios });
            showToast(res?.message ?? 'Cambios guardados.');
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

    const handleReactivarEdicion = async () => {
        if (!idNum) return;
        if (!window.confirm(
            '¿Permitir que el colaborador vuelva a editar su vestuario en «Mi vestuario» para el ejercicio vigente? '
            + 'Podrá cambiar tallas, artículos y cantidades hasta que vuelva a guardar o usted cierre desde aquí.'
        )) return;
        setReactivando(true);
        try {
            await api.post(`/api/empleados/${idNum}/vestuario/reactivar-edicion`, { anio: ejercicioVigente });
            showToast('Listo: el colaborador puede editar de nuevo en Mi vestuario.');
            load(anio ?? ejercicioVigente);
        } catch (err) {
            alert(err.message || 'No se pudo reactivar');
        } finally {
            setReactivando(false);
        }
    };

    if (!idNum || Number.isNaN(idNum)) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-zinc-500">Identificador de colaborador no válido.</p>
                <Link to={backPath} className="text-brand-gold text-sm font-bold mt-4 inline-block">{backLabel}</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <span className="size-7 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    if (apiError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
                <Shirt size={28} className="text-amber-400" strokeWidth={1.3} />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 text-center max-w-sm">{apiError}</p>
                <div className="flex gap-3">
                    <button type="button" onClick={() => load(anio ?? undefined)}
                        className="px-5 py-2.5 rounded-2xl border border-zinc-200 text-[11px] font-bold">Reintentar</button>
                    <Link to={backPath}
                        className="px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold">
                        Volver
                    </Link>
                </div>
            </div>
        );
    }

    if (!data?.empleado) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-zinc-500">No se encontró información del colaborador.</p>
                <Link to={backPath} className="text-brand-gold text-sm font-bold mt-4 inline-block">{backLabel}</Link>
            </div>
        );
    }

    const puedeEditar = data?.puede_editar_vestuario ?? false;
    const puedeReactivar = data?.puede_reactivar_vestuario_empleado ?? false;
    const edicionCerradaEmp = data?.edicion_cerrada_ejercicio_vigente ?? false;
    const viendoHistorico = (anio ?? data.anio) !== ejercicioVigente;
    const emp = data.empleado;

    return (
        <div className={pendingCountCombined > 0 && puedeEditar ? 'pb-6 md:pb-24' : ''}>
            <div className="mb-6">
                <button type="button" onClick={() => navigate(backPath)}
                    className="inline-flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-brand-gold mb-4 transition-colors">
                    <ArrowLeft size={16} strokeWidth={2} /> {backLabel}
                </button>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        Vestuario del colaborador
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1.5 font-medium">
                        {emp.nombre}
                        {emp.nue && <span className="text-zinc-500"> · NUE {emp.nue}</span>}
                        {emp.delegacion_clave && <span className="text-zinc-500"> · {emp.delegacion_clave}</span>}
                    </p>
                </div>

                <FilterToolbar className="mt-4">
                    <SearchInput
                        label="Filtrar artículos"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Nombre o clave…"
                    />
                    <FilterToolbarRow
                        end={
                            puedeReactivar && edicionCerradaEmp && (anio ?? data.anio) === ejercicioVigente ? (
                                <button
                                    type="button"
                                    disabled={reactivando}
                                    onClick={handleReactivarEdicion}
                                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-[11px] font-bold text-amber-900 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 sm:w-auto sm:py-1"
                                >
                                    <Unlock size={12} strokeWidth={2} aria-hidden />
                                    {reactivando ? '…' : 'Activar edición en Mi vestuario'}
                                </button>
                            ) : null
                        }
                    >
                        {aniosSelect.length > 1 ? (
                            <FilterSelectShell id="mi-del-vest-anio" label="Ejercicio" icon={Calendar} className="min-w-0 sm:w-[12rem]">
                                <select
                                    id="mi-del-vest-anio"
                                    value={anio ?? data.anio}
                                    onChange={(e) => handleAnioChange(Number(e.target.value))}
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                                >
                                    {aniosSelect.map((a) => (
                                        <option key={a} value={a}>{a}{a === ejercicioVigente ? ' (vigente)' : ''}</option>
                                    ))}
                                </select>
                            </FilterSelectShell>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ejercicio</span>
                                <span className="text-[13px] font-bold text-brand-gold">{anio ?? data.anio}</span>
                            </div>
                        )}
                        {(anio ?? data.anio) !== ejercicioVigente && (
                            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">histórico</span>
                        )}
                    </FilterToolbarRow>
                </FilterToolbar>

                <div className="mt-4">
                    <VestuarioResumenTotales
                        variant="header"
                        rubrica="Resumen"
                        asignacionesMerged={asignacionesParaTotales}
                        mostrandoFiltrados={Boolean(debouncedFilter?.trim())}
                        totalFiltrados={listadoGrid.length}
                    />
                </div>
                {puedeEditar && (anio ?? data.anio) === ejercicioVigente && (
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => setModalAgregarOpen(true)}
                            disabled={!puedeAgregarOtraLinea}
                            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-brand-gold/35 bg-brand-gold/10 text-[12px] font-bold text-brand-gold hover:bg-brand-gold/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Agregar otro artículo (otra partida)
                        </button>
                        {!puedeAgregarOtraLinea && importeBaselineTotal > 0 ? (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl leading-snug">
                                Para agregar una línea nueva, el colaborador debe tener saldo: baje cantidades o elija artículos más baratos en las líneas actuales.
                            </p>
                        ) : null}
                    </div>
                )}
                <div className="mt-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-800/40 px-5 py-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 shadow-sm">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0" strokeWidth={1.5} />
                        <div>
                            {viendoHistorico ? (
                                <>Ejercicio {anio ?? data.anio}: solo consulta. Para editar, elija el ejercicio vigente ({ejercicioVigente}).</>
                            ) : !periodoActivo ? (
                                <>No hay periodo activo — no se pueden aplicar cambios por el momento.</>
                            ) : puedeEditar ? (
                                <>
                                    {edicionCerradaEmp ? (
                                        <>
                                            El colaborador ya confirmó su vestuario: en <strong>Mi vestuario</strong> no puede modificar el ejercicio {ejercicioVigente} hasta que usted pulse <strong>Activar edición en Mi vestuario</strong> arriba.
                                            {' '}Mientras tanto puede seguir corrigiendo aquí y usar <strong>Guardar cambios</strong> (no se aplican hasta guardar).
                                        </>
                                    ) : null}
                                    Use «Cambiar talla / artículo / cantidad» para marcar cambios; pulse <strong>Guardar cambios</strong> al final para enviar todo junto (no se guarda al pulsar «Aceptar» en cada ventana).
                                    {periodoActivo?.fecha_fin && (
                                        <> Periodo hasta {new Date(periodoActivo.fecha_fin.length === 10 ? `${periodoActivo.fecha_fin}T00:00:00` : periodoActivo.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
                                    )}
                                </>
                            ) : (
                                <>No puede editar el vestuario de este colaborador en este momento (periodo o permisos).</>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {listadoGrid.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Shirt size={32} className="text-zinc-200 dark:text-zinc-700" strokeWidth={1.2} />
                    <p className="text-[11px] text-zinc-400">
                        {filterSearch ? 'Sin resultados.' : `Sin asignaciones para el ejercicio ${data.anio}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
                    className="z-40 max-md:mt-10 max-md:rounded-2xl max-md:border max-md:border-zinc-200/80 dark:max-md:border-zinc-700/50 max-md:shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:max-md:shadow-none bg-white/95 dark:bg-zinc-950/95 md:fixed md:bottom-0 md:left-0 md:right-0 md:border-t md:border-zinc-200 md:dark:border-zinc-800 md:backdrop-blur-md md:shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                            <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                    {pendingCountCombined === 1 ? '1 cambio pendiente' : `${pendingCountCombined} cambios pendientes`}
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                                    Los cambios no se envían hasta que pulse «Guardar cambios». Puede modificar varias prendas y guardar una sola vez.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                            <button type="button" onClick={descartarPendientes} disabled={savingBatch}
                                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50">
                                Descartar
                            </button>
                            <button type="button" onClick={confirmarCambios} disabled={savingBatch}
                                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50">
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
                    <button type="button" onClick={() => setTallaBloqueo(null)}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold">
                        Entendido
                    </button>
                }
            >
                <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                    Corrija estas prendas antes de guardar:
                </p>
                <ul className="space-y-2.5 max-h-[min(50vh,320px)] overflow-y-auto pr-1">
                    {tallaBloqueo?.map((f, i) => (
                        <li key={i} className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/25 px-3.5 py-3">
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
