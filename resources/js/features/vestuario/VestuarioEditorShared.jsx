/**
 * UI y utilidades compartidas entre Mi vestuario y vestuario desde Mi delegación.
 */
import { useState, useEffect } from 'react';
import { Ruler, RefreshCw, CheckCircle, Search } from 'lucide-react';
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

export function ModalCantidad({ item, onClose, onApply }) {
    const [cantidad, setCantidad] = useState(item?.cantidad ?? 1);
    useEffect(() => { if (item) setCantidad(item.cantidad ?? 1); }, [item]);
    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar cantidad" size="sm"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">Cancelar</button>
                    <button type="button" onClick={() => onApply(cantidad)} disabled={cantidad < 1}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className="text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-300">{item.descripcion}</p>
                    <input type="number" min="1" max="100" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold/25" />
                </div>
            )}
        </Modal>
    );
}

export function PrendaCard({ item, onEditTalla, onCambiarProducto, onEditCantidad, editable }) {
    const st = catStyle(item.partida);
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-2xl flex flex-col transition-all duration-300 ${item._pendiente ? 'border border-amber-300 dark:border-amber-600/50 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/25' : 'border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md'}`}>
            <div className="px-5 py-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate">
                            {item.clave_vestuario || item.codigo || `Partida ${item.partida}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {item.heredado_preview && (
                            <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">
                                Año anterior
                            </span>
                        )}
                        {item._pendiente && (
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                                Pendiente
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-3 mb-5">
                    {item.descripcion}
                </p>

                <div className="flex items-center gap-6 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Cant</span>
                        {editable ? (
                            <button type="button" onClick={() => onEditCantidad(item)}
                                className="text-[13px] font-bold text-brand-gold hover:underline text-left">
                                {item.cantidad}
                            </button>
                        ) : (
                            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{item.cantidad}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Talla</span>
                        {editable ? (
                            <button type="button" onClick={() => onEditTalla(item)}
                                className="flex items-center gap-1 text-[13px] font-bold text-brand-gold hover:underline">
                                {item.talla || '—'}
                            </button>
                        ) : (
                            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{item.talla || '—'}</span>
                        )}
                    </div>
                </div>
            </div>

            {editable && (
                <div className="px-3 pb-3 flex gap-1 border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                    <button type="button" onClick={() => onEditTalla(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors touch-manipulation">
                        <Ruler size={13} strokeWidth={2} /> Talla
                    </button>
                    <button type="button" onClick={() => onCambiarProducto(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors touch-manipulation">
                        <RefreshCw size={13} strokeWidth={2} /> Artículo
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
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => onApply(talla)} disabled={!talla}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-5">
                    <p className="text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{item.descripcion}</p>
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
    const debouncedSearch = useDebounce(search, 350);

    useEffect(() => { if (item) { setSelected(null); setTalla(item.talla ?? ''); setSearch(''); } }, [item]);

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

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar artículo" size="lg"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => onApply(selected, talla)} disabled={!selected}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        Aceptar
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-5">
                    <div className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[13px] text-zinc-600 dark:text-zinc-300">
                        Artículo actual: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{item.descripcion}</span>
                    </div>
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
                        ) : (
                            productos.map(p => (
                                <button key={p.id} type="button" onClick={() => setSelected(p)}
                                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${selected?.id === p.id
                                        ? 'bg-brand-gold/8 border-l-4 border-brand-gold'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] sm:text-[14px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">{p.descripcion}</p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{p.clave_vestuario || p.codigo || '—'}</p>
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
