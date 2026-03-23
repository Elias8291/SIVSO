import { useState, useEffect, useCallback } from 'react';
import { Shirt, Ruler, RefreshCw, CheckCircle, Search, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from '../components/ui';
import { useDebounce } from '../lib/useDebounce';

/* ── Categorías visuales por partida ──────────────────────────────────────── */
const CATEGORY_STYLE = {
    default: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-zinc-400' },
    2711: { bg: 'bg-amber-50  dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    2712: { bg: 'bg-sky-50    dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-400' },
    2721: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-400' },
};
const catStyle = (partida) => CATEGORY_STYLE[partida] ?? CATEGORY_STYLE.default;

const TALLAS_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
    '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '36', '38', '40', '42', '44',
    '16', '17', '18', '19', '20', '21'];

/* ── Toast ────────────────────────────────────────────────────────────────── */
function Toast({ message, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl text-[12px] font-semibold">
            <CheckCircle size={15} strokeWidth={2} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            {message}
        </div>
    );
}

/* ── Tarjeta de prenda ────────────────────────────────────────────────────── */
function PrendaCard({ item, onEditTalla, onCambiarProducto, editable }) {
    const st = catStyle(item.partida);
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col">
            {/* Encabezado coloreado */}
            <div className={`${st.bg} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${st.dot}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${st.text}`}>
                        {item.clave_vestuario || item.codigo || `Partida ${item.partida}`}
                    </span>
                </div>
                {item.marca && (
                    <span className={`text-[9px] font-semibold ${st.text} opacity-70`}>{item.marca}</span>
                )}
            </div>

            {/* Cuerpo */}
            <div className="px-4 py-4 flex-1 flex flex-col gap-3">
                <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-3">
                    {item.descripcion}
                </p>

                <div className="flex items-center gap-3 flex-wrap mt-auto pt-2 border-t border-zinc-50 dark:border-zinc-800/50">
                    {/* Cantidad */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Cantidad</span>
                        <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{item.cantidad}</span>
                    </div>

                    {/* Talla */}
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Talla</span>
                        {editable ? (
                            <button
                                onClick={() => onEditTalla(item)}
                                className="flex items-center gap-1 text-sm font-black text-brand-gold hover:underline"
                            >
                                {item.talla || '—'}
                                <Ruler size={10} strokeWidth={2} />
                            </button>
                        ) : (
                            <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{item.talla || '—'}</span>
                        )}
                    </div>

                    {/* Precio */}
                    {item.precio_unitario && (
                        <div className="flex flex-col items-center ml-auto">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">P. Unit.</span>
                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                ${Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pie */}
            {editable && (
                <div className="px-4 pb-4 flex gap-2">
                    <button
                        onClick={() => onEditTalla(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 min-h-[42px] py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-brand-gold/50 hover:text-brand-gold active:scale-[0.98] transition-all touch-manipulation"
                    >
                        <Ruler size={11} strokeWidth={2} /> Cambiar talla
                    </button>
                    <button
                        onClick={() => onCambiarProducto(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 min-h-[42px] py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-brand-gold/50 hover:text-brand-gold active:scale-[0.98] transition-all touch-manipulation"
                    >
                        <RefreshCw size={11} strokeWidth={2} /> Cambiar artículo
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Modal editar talla ───────────────────────────────────────────────────── */
function ModalTalla({ item, onClose, onSave, saving }) {
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
                    <button onClick={() => onSave(talla)} disabled={saving || !talla}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        {saving ? 'Guardando…' : 'Guardar talla'}
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
                        {/* Tallas rápidas */}
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-300 mb-3">Selección rápida</p>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                            {TALLAS_COMUNES.map(t => (
                                <button key={t} type="button"
                                    onClick={() => setTalla(t)}
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

/* ── Modal cambiar producto ───────────────────────────────────────────────── */
function ModalCambiarProducto({ item, anio, onClose, onSave, saving }) {
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
        fetch(`/api/productos?all=1&partida=${item.partida}&anio=${anio || ''}&search=${encodeURIComponent(debouncedSearch)}`, {
            signal: ctrl.signal, headers: { Accept: 'application/json' }, credentials: 'same-origin',
        })
            .then(r => r.json()).then(j => { setProductos(j.data ?? []); setLoadingP(false); })
            .catch(e => { if (e.name !== 'AbortError') setLoadingP(false); });
        return () => ctrl.abort();
    }, [debouncedSearch, item]);

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar artículo" size="lg"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">
                        Cancelar
                    </button>
                    <button onClick={() => onSave(selected.id, talla)} disabled={saving || !selected}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        {saving ? 'Guardando…' : 'Confirmar cambio'}
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-5">
                    <div className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[13px] text-zinc-600 dark:text-zinc-300">
                        Artículo actual: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{item.descripcion}</span>
                    </div>

                    {/* Buscador */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                        <input
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar artículo de reemplazo..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all"
                        />
                    </div>

                    {/* Lista de productos */}
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800/60 divide-y divide-zinc-50 dark:divide-zinc-800/40">
                        {loadingP ? (
                            <div className="py-8 flex items-center justify-center">
                                <span className="size-5 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                            </div>
                        ) : productos.length === 0 ? (
                            <p className="py-8 text-center text-[11px] text-zinc-400">Sin resultados.</p>
                        ) : (
                            productos.map(p => (
                                <button key={p.id} type="button"
                                    onClick={() => setSelected(p)}
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

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function MiVestuarioPage() {
    const [data, setData] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    const [anio, setAnio] = useState(null);

    const [editTalla, setEditTalla] = useState(null);
    const [cambiarProd, setCambiarProd] = useState(null);
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

    const handleSaveTalla = async (talla) => {
        setSaving(true);
        try {
            await api.put(`/api/mi-vestuario/${editTalla.id}/talla`, { talla });
            showToast('Talla actualizada.');
            setEditTalla(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleSaveProducto = async (productoId, talla) => {
        setSaving(true);
        try {
            await api.put(`/api/mi-vestuario/${cambiarProd.id}/producto`, { producto_id: productoId, talla });
            showToast('Artículo actualizado.');
            setCambiarProd(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const asignaciones = (data?.asignaciones ?? []).filter(a =>
        debouncedFilter
            ? a.descripcion.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
            (a.clave_vestuario ?? '').toLowerCase().includes(debouncedFilter.toLowerCase())
            : true
    );

    const total = asignaciones.reduce((s, a) => s + (Number(a.importe) || 0), 0);

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

    const editable = !!periodoActivo;

    return (
        <div>
            {/* Encabezado */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h2 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-tight">
                            Mi Vestuario
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[13px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                                Ejercicio
                            </p>
                            {(data.anios_disponibles ?? []).length > 1 ? (
                                <select
                                    value={anio ?? data.anio}
                                    onChange={(e) => handleAnioChange(Number(e.target.value))}
                                    className="text-[13px] font-bold text-brand-gold bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 cursor-pointer"
                                >
                                    {(data.anios_disponibles ?? []).map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-[13px] font-bold text-brand-gold">{data.anio}</span>
                            )}
                            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">· NUE {data.empleado.nue} · {data.empleado.delegacion_clave}</span>
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Total asignado</p>
                            <p className="text-xl font-black text-zinc-900 dark:text-white">
                                {asignaciones.length} <span className="text-sm font-semibold text-zinc-400">artículos</span>
                            </p>
                        </div>
                        {total > 0 && (
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Importe</p>
                                <p className="text-xl font-black text-brand-gold">
                                    ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buscador filtro local */}
                <div className="mt-4 relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                    <input
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Filtrar artículos…"
                        className="w-full pl-9 pr-4 py-3 text-base sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold/40 transition-all touch-manipulation"
                    />
                </div>

                {/* Alerta periodo */}
                <div className="mt-3 flex w-full items-center p-3 text-sm text-white bg-zinc-800 dark:bg-zinc-700 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {periodoActivo
                        ? `Periodo activo hasta el ${(() => { const f = periodoActivo.fecha_fin; const d = new Date(f?.length === 10 ? f + 'T00:00:00' : f); return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); })()} — puedes actualizar tus tallas y artículos.`
                        : 'No hay periodo activo — la edición no está disponible por el momento.'
                    }
                </div>
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
                            editable={editable}
                            onEditTalla={setEditTalla}
                            onCambiarProducto={setCambiarProd}
                        />
                    ))}
                </div>
            )}

            <ModalTalla item={editTalla} onClose={() => setEditTalla(null)} onSave={handleSaveTalla} saving={saving} />
            <ModalCambiarProducto item={cambiarProd} anio={anio ?? data?.anio} onClose={() => setCambiarProd(null)} onSave={handleSaveProducto} saving={saving} />

            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
