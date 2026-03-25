/**
 * UI y utilidades compartidas entre Mi vestuario y vestuario desde Mi delegación.
 */
import { useState, useEffect, useMemo } from 'react';
import { Ruler, RefreshCw, CheckCircle, Search, Minus, Plus, Hash } from 'lucide-react';
import { Modal } from '../../components/ui';
import { useDebounce } from '../../lib/useDebounce';

export const CATEGORY_STYLE = {
    default: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-zinc-400' },
    2711: { bg: 'bg-amber-50  dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    2712: { bg: 'bg-sky-50    dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-400' },
    2721: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-400' },
};
export const catStyle = (partida) => CATEGORY_STYLE[partida] ?? CATEGORY_STYLE.default;

export const TALLAS_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
    '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '36', '38', '40', '42', '44',
    '16', '17', '18', '19', '20', '21'];

export function fmtMx(n) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function mergedRow(orig, patch) {
    if (!patch) return orig;
    const o = { ...orig };
    if (patch.producto_id != null) o.producto_id = patch.producto_id;
    if (patch.talla !== undefined && patch.talla !== null) o.talla = patch.talla;
    if (patch.cantidad != null) o.cantidad = patch.cantidad;
    if (patch.descripcion) o.descripcion = patch.descripcion;
    if (patch.clave_vestuario != null && patch.clave_vestuario !== '') {
        o.clave_vestuario = patch.clave_vestuario;
        o.codigo = patch.clave_vestuario;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'precio_unitario')) {
        o.precio_unitario = patch.precio_unitario;
    }
    return o;
}

export function rowsEquivalent(orig, patch) {
    if (!patch || Object.keys(patch).length === 0) return true;
    const m = mergedRow(orig, patch);
    return m.producto_id === orig.producto_id
        && String(m.talla ?? '') === String(orig.talla ?? '')
        && Number(m.cantidad) === Number(orig.cantidad);
}

export function displayItem(orig, patch) {
    const m = mergedRow(orig, patch);
    const pendiente = patch && !rowsEquivalent(orig, patch);
    return { ...m, _pendiente: !!pendiente };
}

function patchRevisaTallaUOrigen(orig, patch) {
    if (!patch) return false;
    if (patch.producto_id != null && patch.producto_id !== orig.producto_id) return true;
    return Object.prototype.hasOwnProperty.call(patch, 'talla');
}

export function listarPrendasConTallaPendiente(asignaciones, baseline, pendingEdits) {
    const fallos = [];
    for (const row of asignaciones) {
        const orig = baseline.find((x) => x.id === row.id) ?? row;
        const patch = pendingEdits[row.id];
        const m = mergedRow(orig, patch);
        const tallaStr = String(m.talla ?? '').trim();
        if (!tallaStr) {
            fallos.push({
                descripcion: orig.descripcion ?? 'Artículo',
                clave: orig.clave_vestuario ?? orig.codigo ?? '—',
                motivo: 'No hay talla indicada.',
            });
            continue;
        }
        if (orig.heredado_preview && !patchRevisaTallaUOrigen(orig, patch)) {
            fallos.push({
                descripcion: orig.descripcion ?? 'Artículo',
                clave: orig.clave_vestuario ?? orig.codigo ?? '—',
                motivo: 'Debes abrir «Cambiar talla» o «Cambiar artículo» y confirmar (viene del año anterior).',
            });
        }
    }
    return fallos;
}

export function Toast({ message, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl text-[12px] font-semibold">
            <CheckCircle size={15} strokeWidth={2} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            {message}
        </div>
    );
}

/**
 * Totales del vestuario completo (no del filtro).
 * @param {'header' | 'footer'} variant — header: bajo el título, más grande; footer: pie discreto.
 * @param {string} [rubrica] — texto pequeño sobre la línea de totales (solo variant header).
 */
export function VestuarioResumenTotales({ asignacionesMerged, mostrandoFiltrados, totalFiltrados, variant = 'footer', rubrica = 'Tu vestuario' }) {
    const articulosDistintos = asignacionesMerged.length;
    const totalPiezas = asignacionesMerged.reduce((acc, a) => acc + (Number(a.cantidad) || 0), 0);
    const hayFiltro = mostrandoFiltrados && totalFiltrados !== articulosDistintos;

    if (articulosDistintos === 0) return null;

    if (variant === 'header') {
        return (
            <div className="rounded-xl border border-zinc-200/65 bg-gradient-to-r from-brand-gold/[0.05] via-white to-zinc-50/40 px-4 py-3 dark:border-zinc-800/75 dark:from-brand-gold/[0.04] dark:via-zinc-900/90 dark:to-zinc-900 sm:rounded-2xl sm:px-5 sm:py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="hidden h-9 w-0.5 shrink-0 rounded-full bg-brand-gold/70 sm:block" aria-hidden />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-gold/95 mb-1.5 sm:mb-1">
                            {rubrica}
                        </p>
                        <p className="flex flex-wrap items-baseline justify-center gap-x-0 gap-y-0.5 sm:justify-start">
                            <span className="tabular-nums font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-[17px] sm:text-[19px]">
                                {articulosDistintos}
                            </span>
                            <span className="ml-1 text-[13px] sm:text-[14px] font-medium text-zinc-600 dark:text-zinc-400">
                                {articulosDistintos === 1 ? 'artículo' : 'artículos'}
                            </span>
                            <span className="mx-2 text-base font-light text-zinc-300 dark:text-zinc-600 leading-none" aria-hidden>
                                ·
                            </span>
                            <span className="tabular-nums font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-[17px] sm:text-[19px]">
                                {totalPiezas}
                            </span>
                            <span className="ml-1 text-[13px] sm:text-[14px] font-medium text-zinc-600 dark:text-zinc-400">
                                {totalPiezas === 1 ? 'pieza' : 'piezas'}
                            </span>
                        </p>
                    </div>
                </div>
                {hayFiltro ? (
                    <p className="mt-2.5 border-t border-zinc-200/50 pt-2.5 text-[10px] leading-snug text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400">
                        Filtro activo: se listan {totalFiltrados} de {articulosDistintos}. Las cifras son del vestuario completo.
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <footer className="mt-10 border-t border-zinc-200/50 pt-7 dark:border-zinc-800/50">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
                <div className="h-px w-10 rounded-full bg-brand-gold/50" aria-hidden />
                <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{articulosDistintos}</span>
                    {' '}
                    {articulosDistintos === 1 ? 'artículo' : 'artículos'}
                    <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{totalPiezas}</span>
                    {' '}
                    {totalPiezas === 1 ? 'pieza' : 'piezas'}
                </p>
                {hayFiltro ? (
                    <p className="text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">
                        Filtro activo: se listan {totalFiltrados} de {articulosDistintos}. Las cifras son del vestuario completo.
                    </p>
                ) : null}
            </div>
        </footer>
    );
}

export function ModalCantidad({ item, cantidadOriginal, onClose, onApply }) {
    const [cantidad, setCantidad] = useState(item?.cantidad ?? 1);
    useEffect(() => { if (item) setCantidad(item.cantidad ?? 1); }, [item]);
    const base = cantidadOriginal != null ? Number(cantidadOriginal) : null;
    const redujoVsServidor = base != null && !Number.isNaN(base) && cantidad < base;
    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar cantidad" size="sm"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">Cancelar</button>
                    <button type="button" onClick={() => onApply(cantidad)} disabled={cantidad < 1}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className="line-clamp-4 sm:line-clamp-none sm:max-h-40 sm:overflow-y-auto text-[13px] sm:text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300 break-words">
                        {item.descripcion}
                    </p>
                    {redujoVsServidor ? (
                        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/50 rounded-xl px-3 py-2.5">
                            Al bajar la cantidad libera importe dentro de su asignación. Puede volver a subirla aquí o con el botón <strong className="text-zinc-700 dark:text-zinc-300">+</strong> en la tarjeta (hasta 100 piezas).
                        </p>
                    ) : null}
                    <input type="number" min="1" max="100" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold/25" />
                </div>
            )}
        </Modal>
    );
}

const CANTIDAD_MAX = 100;

export function PrendaCard({ item, onEditTalla, onCambiarProducto, onEditCantidad, onAdjustCantidad, editable, cantidadBaseline }) {
    const st = catStyle(item.partida);
    const cant = Math.max(1, Math.min(CANTIDAD_MAX, Number(item.cantidad) || 1));
    const puedeMenos = cant > 1;
    const puedeMas = cant < CANTIDAD_MAX;
    const baseCant = cantidadBaseline != null ? Number(cantidadBaseline) : null;
    const mostrarAvisoMenos = editable && baseCant != null && !Number.isNaN(baseCant) && cant < baseCant;
    const modificadoLocal = !!item._pendiente;
    const pendienteRevisar = !!item.heredado_preview && !modificadoLocal;

    const cardShell = modificadoLocal
        ? 'border border-emerald-200/70 bg-emerald-50/45 dark:border-emerald-800/35 dark:bg-emerald-950/20 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30 shadow-sm'
        : pendienteRevisar
            ? 'border border-slate-200/80 bg-slate-50/50 dark:border-slate-700/40 dark:bg-slate-900/35 ring-1 ring-slate-200/40 dark:ring-slate-700/25 shadow-sm'
            : 'border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md';

    return (
        <div className={`rounded-2xl flex flex-col transition-all duration-300 ${cardShell}`}>
            <div className="px-5 py-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">
                            {item.clave_vestuario || item.codigo || `Partida ${item.partida}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {item.heredado_preview && !modificadoLocal && (
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/95 dark:bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/50">
                                Pendiente de revisar
                            </span>
                        )}
                        {modificadoLocal && (
                            <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-300/90 bg-emerald-100/90 dark:bg-emerald-900/35 px-2 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/40">
                                Modificado
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed break-words hyphens-auto mb-5">
                    {item.descripcion}
                </p>

                <div className="flex flex-wrap items-end gap-5 mt-auto">
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">Cantidad</span>
                        {editable && typeof onAdjustCantidad === 'function' ? (
                            <div className="inline-flex items-stretch rounded-xl border border-zinc-200/90 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/50 overflow-hidden">
                                <button
                                    type="button"
                                    aria-label="Disminuir cantidad"
                                    disabled={!puedeMenos}
                                    onClick={() => onAdjustCantidad(item, -1)}
                                    className="flex items-center justify-center px-2.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation"
                                >
                                    <Minus size={16} strokeWidth={2} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onEditCantidad(item)}
                                    title="Escribir cantidad"
                                    className="min-w-[2.75rem] px-2 py-2 text-[14px] font-bold tabular-nums text-zinc-900 dark:text-zinc-50 border-x border-zinc-200/90 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-colors touch-manipulation"
                                >
                                    {cant}
                                </button>
                                <button
                                    type="button"
                                    aria-label="Aumentar cantidad"
                                    disabled={!puedeMas}
                                    onClick={() => onAdjustCantidad(item, 1)}
                                    className="flex items-center justify-center px-2.5 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation"
                                >
                                    <Plus size={16} strokeWidth={2} />
                                </button>
                            </div>
                        ) : editable ? (
                            <button type="button" onClick={() => onEditCantidad(item)}
                                className="text-left text-[14px] font-bold text-brand-gold hover:underline tabular-nums">
                                {cant}
                            </button>
                        ) : (
                            <span className="text-[14px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{cant}</span>
                        )}
                        {mostrarAvisoMenos ? (
                            <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400 max-w-[14rem]">
                                Cantidad por debajo de la guardada: puede recuperar piezas con <strong className="text-zinc-600 dark:text-zinc-300">+</strong> si lo necesita.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">Talla</span>
                        {editable ? (
                            <button type="button" onClick={() => onEditTalla(item)}
                                className="flex items-center gap-1 text-[13px] font-bold text-brand-gold hover:underline text-left">
                                {item.talla || '—'}
                            </button>
                        ) : (
                            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{item.talla || '—'}</span>
                        )}
                    </div>
                </div>
            </div>

            {editable && (
                <div className="px-2 pb-3 flex gap-1 border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                    <button type="button" onClick={() => onEditTalla(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors touch-manipulation">
                        <Ruler size={13} strokeWidth={2} /> Talla
                    </button>
                    <button type="button" onClick={() => onCambiarProducto(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors touch-manipulation">
                        <RefreshCw size={13} strokeWidth={2} /> Artículo
                    </button>
                    <button type="button" onClick={() => onEditCantidad(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors touch-manipulation">
                        <Hash size={13} strokeWidth={2} /> Cantidad
                    </button>
                </div>
            )}
        </div>
    );
}

export function ModalTalla({ item, onClose, onApply }) {
    const [talla, setTalla] = useState(item?.talla ?? '');
    useEffect(() => { if (item) setTalla(item.talla ?? ''); }, [item]);

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar talla" size="md"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => onApply(talla)} disabled={!talla}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-5">
                    <p className="line-clamp-4 sm:line-clamp-none text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed break-words">{item.descripcion}</p>
                    <div>
                        <label className="block text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                            Talla actual: <span className="text-brand-gold">{item.talla || '—'}</span>
                        </label>
                        <input
                            value={talla}
                            onChange={(e) => setTalla(e.target.value.toUpperCase())}
                            maxLength={10}
                            placeholder="Ej. M, 27, XL…"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-base text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 transition-all mb-4"
                        />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300 mb-3">Selección rápida</p>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                            {TALLAS_COMUNES.map(t => (
                                <button key={t} type="button" onClick={() => setTalla(t)}
                                    className={`px-4 py-2 rounded-lg text-[12px] font-bold border transition-all ${talla === t
                                        ? 'bg-brand-gold border-brand-gold text-white'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-brand-gold/50'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export function ModalCambiarProducto({ item, anioCatalogo, onClose, onApply }) {
    const [search, setSearch] = useState('');
    const [productos, setProductos] = useState([]);
    const [selected, setSelected] = useState(null);
    const [talla, setTalla] = useState('');
    const [loadingP, setLoadingP] = useState(false);
    const [soloPrecioConservador, setSoloPrecioConservador] = useState(true);
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => { if (item) { setSelected(null); setTalla(item.talla ?? ''); setSearch(''); setSoloPrecioConservador(true); } }, [item]);

    useEffect(() => {
        if (!item) return;
        setLoadingP(true);
        const ctrl = new AbortController();
        fetch(`/api/productos?all=1&partida=${item.partida}&anio=${anioCatalogo || ''}&search=${encodeURIComponent(debouncedSearch)}`, {
            signal: ctrl.signal, headers: { Accept: 'application/json' }, credentials: 'same-origin',
        })
            .then(r => r.json()).then(j => { setProductos(j.data ?? []); setLoadingP(false); })
            .catch(e => { if (e.name !== 'AbortError') setLoadingP(false); });
        return () => ctrl.abort();
    }, [debouncedSearch, item, anioCatalogo]);

    const precioTope = item ? Number(item.precio_unitario) : NaN;
    const hayTope = item != null && Number.isFinite(precioTope) && precioTope > 0;

    const productosFiltrados = useMemo(() => {
        if (!hayTope || !soloPrecioConservador) return productos;
        return productos.filter((p) => Number(p.precio_unitario ?? 0) <= precioTope + 1e-9);
    }, [productos, hayTope, precioTope, soloPrecioConservador]);

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar artículo" size="lg" mobileFloatingClose
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => onApply(selected, talla)} disabled={!selected}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-5">
                    <div className="hidden sm:block px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[13px] text-zinc-600 dark:text-zinc-300">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Artículo actual</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100 leading-snug break-words">{item.descripcion}</p>
                        {hayTope ? (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                                Precio unitario (catálogo): <span className="font-mono tabular-nums">{fmtMx(precioTope)}</span>
                            </p>
                        ) : null}
                    </div>
                    <p className="sm:hidden text-[11px] text-zinc-500 dark:text-zinc-400 -mt-2">
                        {hayTope ? (
                            <>Precio actual: <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{fmtMx(precioTope)}</span>. </>
                        ) : null}
                        Busque un reemplazo de la misma partida.
                    </p>
                    {hayTope ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-800/30 px-3 py-2.5">
                            <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-300 min-w-0">
                                {soloPrecioConservador
                                    ? 'Solo se listan artículos con precio unitario igual o menor al actual, para no encarecer su asignación.'
                                    : 'Mostrando todo el catálogo de la partida (incluye precios mayores).'}
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSoloPrecioConservador((v) => !v); setSelected(null); }}
                                className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-brand-gold hover:underline text-left sm:text-right"
                            >
                                {soloPrecioConservador ? 'Ver todos los precios' : 'Solo precios ≤ al actual'}
                            </button>
                        </div>
                    ) : null}
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar artículo de reemplazo..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all"
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800/60 divide-y divide-zinc-50 dark:divide-zinc-800/40">
                        {loadingP ? (
                            <div className="py-8 flex items-center justify-center">
                                <span className="size-5 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                            </div>
                        ) : productos.length === 0 ? (
                            <p className="py-8 text-center text-[11px] text-zinc-400">Sin resultados.</p>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="py-6 px-4 text-center space-y-3">
                                <p className="text-[12px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    No hay artículos más baratos o iguales en esta búsqueda. Puede ampliar a todo el catálogo.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSoloPrecioConservador(false)}
                                    className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-bold"
                                >
                                    Ver todos los artículos
                                </button>
                            </div>
                        ) : (
                            productosFiltrados.map(p => (
                                <button key={p.id} type="button" onClick={() => setSelected(p)}
                                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${selected?.id === p.id
                                        ? 'bg-brand-gold/8 border-l-4 border-brand-gold'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] sm:text-[14px] font-semibold text-zinc-800 dark:text-zinc-100 break-words">{p.descripcion}</p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                            <span className="font-mono">{p.clave_vestuario || p.codigo || '—'}</span>
                                            {p.precio_unitario != null ? (
                                                <span className="ml-2 tabular-nums">{fmtMx(p.precio_unitario)}</span>
                                            ) : null}
                                        </p>
                                    </div>
                                    {selected?.id === p.id && (
                                        <CheckCircle size={18} className="text-brand-gold shrink-0" strokeWidth={2} />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    {selected && (
                        <div className="pt-2">
                            <label className="block text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                                Talla para el nuevo artículo
                            </label>
                            <input value={talla} onChange={(e) => setTalla(e.target.value.toUpperCase())} maxLength={10}
                                placeholder="Talla (opcional)"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 transition-all"
                            />
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
