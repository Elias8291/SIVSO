/**
 * Vestuario de un colaborador desde Mi delegación — misma UX que Mi vestuario: cambios locales y un solo «Guardar cambios».
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Shirt, Search, AlertCircle, ArrowLeft, Unlock } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from '../components/ui';
import { useDebounce } from '../lib/useDebounce';
import {
    mergedRow,
    rowsEquivalent,
    displayItem,
    listarPrendasConTallaPendiente,
    Toast,
    ModalCantidad,
    PrendaCard,
    ModalTalla,
    ModalCambiarProducto,
    VestuarioResumenTotales,
} from '../features/vestuario/VestuarioEditorShared';

export default function MiDelegacionVestuarioPage() {
    const { empleadoId } = useParams();
    const navigate = useNavigate();
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
        const t = String(talla ?? '').trim();
        upsertPending(editTalla.id, { talla: t.toUpperCase() });
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
        upsertPending(editCantidad.id, { cantidad: n });
        setEditCantidad(null);
    };

    const handleAdjustCantidad = useCallback((item, delta) => {
        const cur = Number(item.cantidad) || 1;
        const next = Math.min(100, Math.max(1, cur + delta));
        upsertPending(item.id, { cantidad: next });
    }, [upsertPending]);

    const pendingCount = Object.keys(pendingEdits).length;

    const aniosSelect = useMemo(() => {
        const disp = data?.anios_disponibles ?? [];
        const vig = data?.ejercicio_vigente ?? new Date().getFullYear();
        return [...new Set([vig, ...disp])].sort((a, b) => b - a);
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

    const confirmarCambios = async () => {
        if (pendingCount === 0 || !idNum) return;

        const ejercicioVigenteLocal = data?.ejercicio_vigente ?? new Date().getFullYear();
        const viendoHistoricoLocal = (anio ?? data?.anio) !== ejercicioVigenteLocal;
        const puedeEditarLocal = data?.puede_editar_vestuario ?? false;

        if (puedeEditarLocal && !viendoHistoricoLocal) {
            const fallosTalla = listarPrendasConTallaPendiente(
                data?.asignaciones ?? [],
                baseline,
                pendingEdits
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
        if (cambios.length === 0) return;

        setSavingBatch(true);
        try {
            const res = await api.post(`/api/empleados/${idNum}/vestuario/guardar-cambios`, { cambios });
            showToast(res?.message ?? 'Cambios guardados.');
            setPendingEdits({});
            load(anio ?? data?.anio);
        } catch (err) {
            alert(err.message || 'No se pudieron guardar los cambios.');
        } finally {
            setSavingBatch(false);
        }
    };

    const descartarPendientes = () => {
        if (pendingCount === 0) return;
        if (!window.confirm('¿Descartar todos los cambios pendientes?')) return;
        setPendingEdits({});
    };

    const handleReactivarEdicion = async () => {
        if (!idNum) return;
        setReactivando(true);
        try {
            await api.post(`/api/empleados/${idNum}/vestuario/reactivar-edicion`, { anio: ejercicioVigente });
            showToast('Actualización reactivada para el colaborador.');
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
                <Link to="/dashboard/mi-delegacion" className="text-brand-gold text-sm font-bold mt-4 inline-block">Volver a Mi delegación</Link>
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
                    <Link to="/dashboard/mi-delegacion"
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
                <Link to="/dashboard/mi-delegacion" className="text-brand-gold text-sm font-bold mt-4 inline-block">Volver a Mi delegación</Link>
            </div>
        );
    }

    const puedeEditar = data?.puede_editar_vestuario ?? false;
    const puedeReactivar = data?.puede_reactivar_vestuario_empleado ?? false;
    const edicionCerradaEmp = data?.edicion_cerrada_ejercicio_vigente ?? false;
    const viendoHistorico = (anio ?? data.anio) !== ejercicioVigente;
    const emp = data.empleado;

    return (
        <div className={pendingCount > 0 && puedeEditar ? 'pb-28 sm:pb-24' : ''}>
            <div className="mb-6">
                <button type="button" onClick={() => navigate('/dashboard/mi-delegacion')}
                    className="inline-flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-brand-gold mb-4 transition-colors">
                    <ArrowLeft size={16} strokeWidth={2} /> Volver a Mi delegación
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
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Ejercicio:</span>
                        {aniosSelect.length > 1 ? (
                            <select
                                value={anio ?? data.anio}
                                onChange={(e) => handleAnioChange(Number(e.target.value))}
                                className="text-[13px] font-bold text-brand-gold bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-gold/30 cursor-pointer"
                            >
                                {aniosSelect.map((a) => (
                                    <option key={a} value={a}>{a}{a === ejercicioVigente ? ' (vigente)' : ''}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-[13px] font-bold text-brand-gold">{anio ?? data.anio}</span>
                        )}
                        {(anio ?? data.anio) !== ejercicioVigente && (
                            <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">histórico</span>
                        )}
                        {puedeReactivar && edicionCerradaEmp && (
                            <button
                                type="button"
                                disabled={reactivando}
                                onClick={handleReactivarEdicion}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:brightness-105 active:scale-95 transition-all ml-1"
                            >
                                <Unlock size={12} strokeWidth={2} />
                                {reactivando ? '…' : 'Activar actualización'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 relative w-full sm:w-96">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Buscar artículo por nombre o clave..."
                        className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 shadow-sm transition-all touch-manipulation"
                    />
                </div>

                <div className="mt-4">
                    <VestuarioResumenTotales
                        variant="header"
                        rubrica="Resumen"
                        asignacionesMerged={asignacionesMerged}
                        mostrandoFiltrados={Boolean(debouncedFilter?.trim())}
                        totalFiltrados={asignaciones.length}
                    />
                </div>
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
                                        <>El colaborador ya confirmó su vestuario para {ejercicioVigente}. Puede seguir ajustando desde aquí y usar <strong>Guardar cambios</strong> (los cambios no se envían hasta entonces). </>
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

            {asignaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Shirt size={32} className="text-zinc-200 dark:text-zinc-700" strokeWidth={1.2} />
                    <p className="text-[11px] text-zinc-400">
                        {filterSearch ? 'Sin resultados.' : `Sin asignaciones para el ejercicio ${data.anio}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {asignaciones.map((item) => (
                        <PrendaCard
                            key={item.id}
                            item={item}
                            editable={puedeEditar}
                            onEditTalla={setEditTalla}
                            onCambiarProducto={setCambiarProd}
                            onEditCantidad={setEditCantidad}
                            onAdjustCantidad={handleAdjustCantidad}
                        />
                    ))}
                </div>
            )}

            <ModalTalla item={editTalla} onClose={() => setEditTalla(null)} onApply={handleApplyTalla} />
            <ModalCambiarProducto item={cambiarProd} anioCatalogo={anioCatalogo} onClose={() => setCambiarProd(null)} onApply={handleApplyProducto} />
            <ModalCantidad item={editCantidad} onClose={() => setEditCantidad(null)} onApply={handleApplyCantidad} />

            {pendingCount > 0 && puedeEditar && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                            <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                                    {pendingCount === 1 ? '1 cambio pendiente' : `${pendingCount} cambios pendientes`}
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
