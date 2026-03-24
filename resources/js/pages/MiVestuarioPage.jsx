import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shirt, Search, AlertCircle } from 'lucide-react';
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
} from '../features/vestuario/VestuarioEditorShared';

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function MiVestuarioPage() {
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
            ? a.descripcion.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
            (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
            : true
    );

    const confirmarCambios = async () => {
        if (pendingCount === 0) return;

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
            const res = await api.post('/api/mi-vestuario/guardar-cambios', { cambios });
            showToast(res?.message ?? 'Cambios guardados. Tu edición para este ejercicio quedó cerrada.');
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

    return (
        <div className={pendingCount > 0 && puedeEditar ? 'pb-28 sm:pb-24' : ''}>
            {/* Encabezado */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                            Mi Vestuario
                        </h2>
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
                            <span className="text-zinc-300 dark:text-zinc-600 px-0.5">•</span>
                            <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 shrink-0">NUE {data.empleado.nue}</span>
                            <span className="text-zinc-300 dark:text-zinc-600 px-0.5">•</span>
                            <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[120px] sm:max-w-[200px]">{data.empleado.delegacion_clave}</span>
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl px-5 py-3 shadow-sm shrink-0">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5">Asignado</p>
                            <p className="text-xl font-black text-zinc-900 dark:text-white leading-none">
                                {asignaciones.length} <span className="text-[13px] font-semibold text-zinc-400">ítems</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buscador filtro local */}
                <div className="mt-6 relative w-full sm:w-96">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Buscar artículo por nombre o clave..."
                        className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 shadow-sm transition-all touch-manipulation"
                    />
                </div>

                {/* Alerta periodo / bloqueo */}
                <div className="mt-3 flex w-full items-center p-3 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    <span>
                        {viendoHistorico ? (
                            <span>
                                Ejercicio {anio ?? data.anio}: solo consulta. Las tallas y artículos de años anteriores no se modifican; trabaja siempre en el ejercicio vigente ({ejercicioVigente}) para actualizar.
                            </span>
                        ) : edicionCerrada ? (
                            <span className="font-semibold text-amber-800 dark:text-amber-300">
                                Ya confirmaste tu vestuario para {ejercicioVigente}. Para corregir algo, tu delegado debe usar «Activar actualización» en Mi delegación.
                            </span>
                        ) : periodoActivo && puedeEditar ? (
                            <span>
                                Periodo ({periodoActivo.anio ?? ejercicioVigente}) hasta el {(() => { const f = periodoActivo.fecha_fin; const d = new Date(f?.length === 10 ? f + 'T00:00:00' : f); return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); })()}
                                . «Guardar cambios» aplica todo y cierra tu edición para este ejercicio (no podrás volver a editar salvo reactivación del delegado).
                            </span>
                        ) : !periodoActivo ? (
                            <span>No hay periodo activo — la edición no está disponible por el momento.</span>
                        ) : (
                            <span>No puedes editar en este momento.</span>
                        )}
                    </span>
                </div>

                {data.vista_hereda_anio_anterior && data.anio_referencia_vista != null && (
                    <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 text-[13px] leading-relaxed text-amber-950 dark:text-amber-100">
                        <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">Actualiza tu vestuario al ejercicio {ejercicioVigente}</p>
                        <p>
                            Lo que ves ahora son tus productos del ejercicio <strong>{data.anio_referencia_vista}</strong>
                            {' '}(precios y claves de ese año). Necesitas revisarlos y guardar los cambios para registrarlos en el ejercicio <strong>{ejercicioVigente}</strong>
                            {' '}con el catálogo actual. Al cambiar de artículo, el listado usa precios y claves del ejercicio vigente.
                        </p>
                    </div>
                )}
            </div>

            {/* Grid de prendas */}
            {asignaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Shirt size={32} className="text-zinc-200 dark:text-zinc-700" strokeWidth={1.2} />
                    <p className="text-[11px] text-zinc-400">
                        {filterSearch ? 'Sin resultados para ese filtro.' : `Sin asignaciones para el ejercicio ${data.anio}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {asignaciones.map(item => (
                        <PrendaCard
                            key={item.id}
                            item={item}
                            editable={puedeEditar}
                            onEditTalla={setEditTalla}
                            onCambiarProducto={setCambiarProd}
                            onEditCantidad={setEditCantidad}
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
