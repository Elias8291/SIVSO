/**
 * Modal para ver y editar vestuario de un empleado (desde Mi Delegación).
 */
import { useState, useEffect, useCallback } from 'react';
import { Ruler, RefreshCw, CheckCircle, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui';
import { useDebounce } from '../../lib/useDebounce';

const CATEGORY_STYLE = {
    default: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-zinc-400' },
    2711: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    2712: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-400' },
    2721: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-400' },
};
const catStyle = (partida) => CATEGORY_STYLE[partida] ?? CATEGORY_STYLE.default;

const TALLAS_COMUNES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '16', '17', '18', '19', '20', '21'];

function PrendaCard({ item, onEditTalla, onCambiarProducto, onEditCantidad, editable }) {
    const st = catStyle(item.partida);
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
            <div className={`${st.bg} px-3 py-2 flex items-center justify-between`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${st.text}`}>
                    {item.clave_vestuario || item.codigo || `Partida ${item.partida}`}
                </span>
                {item.marca && <span className={`text-[9px] ${st.text} opacity-70`}>{item.marca}</span>}
            </div>
            <div className="px-3 py-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">{item.descripcion}</p>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-zinc-400">Cant</span>
                        {editable ? (
                            <button onClick={() => onEditCantidad(item)} className="text-xs font-bold text-brand-gold hover:underline">
                                {item.cantidad}
                            </button>
                        ) : (
                            <span className="text-xs font-bold">{item.cantidad}</span>
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-bold uppercase text-zinc-400">Talla</span>
                        {editable ? (
                            <button onClick={() => onEditTalla(item)} className="text-xs font-bold text-brand-gold hover:underline">
                                {item.talla || '—'}
                            </button>
                        ) : (
                            <span className="text-xs font-bold">{item.talla || '—'}</span>
                        )}
                    </div>
                    {item.precio_unitario && (
                        <div className="flex flex-col ml-auto">
                            <span className="text-[8px] font-bold uppercase text-zinc-400">P.Unit</span>
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                ${Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            {editable && (
                <div className="px-3 pb-3 flex gap-2">
                    <button onClick={() => onEditTalla(item)} className="flex-1 flex items-center justify-center gap-1 min-h-[40px] py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-brand-gold/50 hover:text-brand-gold active:scale-[0.98] touch-manipulation">
                        <Ruler size={10} /> Talla
                    </button>
                    <button onClick={() => onCambiarProducto(item)} className="flex-1 flex items-center justify-center gap-1 min-h-[40px] py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-brand-gold/50 hover:text-brand-gold active:scale-[0.98] touch-manipulation">
                        <RefreshCw size={10} /> Artículo
                    </button>
                </div>
            )}
        </div>
    );
}

function ModalTalla({ item, onClose, onSave, saving }) {
    const [talla, setTalla] = useState(item?.talla ?? '');
    useEffect(() => { if (item) setTalla(item.talla ?? ''); }, [item]);
    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar talla" size="md"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">Cancelar</button>
                    <button onClick={() => onSave(talla)} disabled={saving || !talla} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className="text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-300">{item.descripcion}</p>
                    <input value={talla} onChange={(e) => setTalla(e.target.value.toUpperCase())} maxLength={10} placeholder="Ej. M, 27"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold/25" />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {TALLAS_COMUNES.map(t => (
                            <button key={t} type="button" onClick={() => setTalla(t)}
                                className={`px-4 py-2 rounded-lg text-[12px] font-bold border ${talla === t ? 'bg-brand-gold border-brand-gold text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

function ModalCambiarProducto({ item, onClose, onSave, saving }) {
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
        const url = `/api/productos?all=1&partida=${item.partida}&search=${encodeURIComponent(debouncedSearch)}`;
        api.get(url).then(j => { setProductos(j.data ?? []); setLoadingP(false); }).catch(() => setLoadingP(false));
    }, [debouncedSearch, item]);

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar artículo" size="lg"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">Cancelar</button>
                    <button onClick={() => onSave(selected?.id, talla)} disabled={saving || !selected} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        {saving ? 'Guardando…' : 'Confirmar'}
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-300">Actual: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{item.descripcion}</span></p>
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.8} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar artículo..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base" />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800">
                        {loadingP ? (
                            <div className="py-6 flex justify-center"><span className="size-5 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" /></div>
                        ) : productos.length === 0 ? (
                            <p className="py-6 text-center text-[13px] text-zinc-400 dark:text-zinc-500">Sin resultados.</p>
                        ) : (
                            productos.map(p => (
                                <button key={p.id} type="button" onClick={() => setSelected(p)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] sm:text-[14px] ${selected?.id === p.id ? 'bg-brand-gold/10 border-l-4 border-brand-gold text-zinc-900 dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>
                                    <span className="flex-1 truncate font-semibold">{p.descripcion}</span>
                                    {selected?.id === p.id && <CheckCircle size={16} className="text-brand-gold shrink-0" strokeWidth={2} />}
                                </button>
                            ))
                        )}
                    </div>
                    {selected && (
                        <input value={talla} onChange={(e) => setTalla(e.target.value.toUpperCase())} maxLength={10} placeholder="Talla (opcional)"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base" />
                    )}
                </div>
            )}
        </Modal>
    );
}

function ModalCantidad({ item, onClose, onSave, saving }) {
    const [cantidad, setCantidad] = useState(item?.cantidad ?? 1);
    useEffect(() => { if (item) setCantidad(item.cantidad ?? 1); }, [item]);
    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar cantidad" size="sm"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation">Cancelar</button>
                    <button onClick={() => onSave(cantidad)} disabled={saving || cantidad < 1} className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50 active:scale-[0.98] touch-manipulation">
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className="text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-300">{item.descripcion}</p>
                    <input type="number" min="1" max="100" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-base focus:outline-none focus:ring-2 focus:ring-brand-gold/25" />
                </div>
            )}
        </Modal>
    );
}

export default function VestuarioEmpleadoModal({ empleado, onClose, onSaved }) {
    const [data, setData] = useState(null);
    const [anio, setAnio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTalla, setEditTalla] = useState(null);
    const [cambiarProd, setCambiarProd] = useState(null);
    const [editCantidad, setEditCantidad] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback((anioParam) => {
        if (!empleado?.id) return;
        setLoading(true);
        setError(null);
        const url = anioParam ? `/api/empleados/${empleado.id}/vestuario?anio=${anioParam}` : `/api/empleados/${empleado.id}/vestuario`;
        api.get(url)
            .then(res => { 
                setData(res); 
                if (!anioParam && res.anio) setAnio(res.anio);
                setLoading(false); 
            })
            .catch(err => { setError(err.message || 'Error al cargar'); setLoading(false); });
    }, [empleado?.id]);

    useEffect(() => { if (empleado?.id) load(); }, [empleado?.id, load]);

    useEffect(() => { const t = toast && setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }, [toast]);

    const handleSaveTalla = async (talla) => {
        if (!empleado?.id || !editTalla) return;
        setSaving(true);
        try {
            await api.put(`/api/empleados/${empleado.id}/vestuario/${editTalla.id}/talla`, { talla });
            setToast('Talla actualizada.');
            setEditTalla(null);
            load(anio);
            onSaved?.();
        } catch (err) { setToast(err.message || 'Error'); }
        finally { setSaving(false); }
    };

    const handleSaveProducto = async (productoId, talla) => {
        if (!empleado?.id || !cambiarProd) return;
        setSaving(true);
        try {
            await api.put(`/api/empleados/${empleado.id}/vestuario/${cambiarProd.id}/producto`, { producto_id: productoId, talla });
            setToast('Artículo actualizado.');
            setCambiarProd(null);
            load(anio);
            onSaved?.();
        } catch (err) { setToast(err.message || 'Error'); }
        finally { setSaving(false); }
    };

    const handleSaveCantidad = async (cantidad) => {
        if (!empleado?.id || !editCantidad) return;
        setSaving(true);
        try {
            await api.put(`/api/empleados/${empleado.id}/vestuario/${editCantidad.id}/cantidad`, { cantidad });
            setToast('Cantidad actualizada.');
            setEditCantidad(null);
            load(anio);
            onSaved?.();
        } catch (err) { setToast(err.message || 'Error'); }
        finally { setSaving(false); }
    };

    const handleAnioChange = (newAnio) => {
        setAnio(newAnio);
        load(newAnio);
    };

    if (!empleado) return null;

    // Check if editable based on active period (if anio matches max available year or active period year)
    // Actually, let's just assume it's editable if the backend doesn't block it, but to disable UI:
    const isLatestYear = data?.anios_disponibles && anio === Math.max(...data.anios_disponibles);
    const editable = isLatestYear; // Simple heuristic for frontend, backend enforces strictly

    return (
        <>
            <Modal open={!!empleado} onClose={onClose} title="Vestuario" size="xl">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{empleado.nombre_completo || 'Empleado'}</p>
                            {empleado.nue && (
                                <p className="text-[11px] text-zinc-500">NUE {empleado.nue} · {empleado.delegacion || ''}</p>
                            )}
                        </div>
                        {data?.anios_disponibles?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Ejercicio</span>
                                <select
                                    value={anio ?? data.anio}
                                    onChange={(e) => handleAnioChange(Number(e.target.value))}
                                    className="text-[13px] font-bold text-brand-gold bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 cursor-pointer"
                                >
                                    {data.anios_disponibles.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="py-12 flex justify-center"><span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" /></div>
                    ) : error ? (
                        <p className="py-8 text-center text-sm text-red-500">{error}</p>
                    ) : !data?.asignaciones?.length ? (
                        <p className="py-8 text-center text-sm text-zinc-500">Sin asignaciones de vestuario.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.asignaciones.map(item => (
                                <PrendaCard 
                                    key={item.id} 
                                    item={item} 
                                    editable={editable}
                                    onEditTalla={setEditTalla} 
                                    onCambiarProducto={setCambiarProd} 
                                    onEditCantidad={setEditCantidad}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            <ModalTalla item={editTalla} onClose={() => setEditTalla(null)} onSave={handleSaveTalla} saving={saving} />
            <ModalCambiarProducto item={cambiarProd} onClose={() => setCambiarProd(null)} onSave={handleSaveProducto} saving={saving} />
            <ModalCantidad item={editCantidad} onClose={() => setEditCantidad(null)} onSave={handleSaveCantidad} saving={saving} />

            {toast && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-lg">
                    <CheckCircle size={14} className="text-emerald-400 dark:text-emerald-600" strokeWidth={2} /> {toast}
                </div>
            )}
        </>
    );
}
