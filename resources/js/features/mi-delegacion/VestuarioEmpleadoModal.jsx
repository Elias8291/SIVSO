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

function PrendaCard({ item, onEditTalla, onCambiarProducto }) {
    const st = catStyle(item.partida);
    return (
        <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
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
                        <span className="text-xs font-bold">{item.cantidad}</span>
                    </div>
                    <button onClick={() => onEditTalla(item)} className="flex flex-col items-start">
                        <span className="text-[8px] font-bold uppercase text-zinc-400">Talla</span>
                        <span className="text-xs font-bold text-[#AF9460]">{item.talla || '—'}</span>
                    </button>
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
            <div className="px-3 pb-3 flex gap-2">
                <button onClick={() => onEditTalla(item)} className="flex-1 flex items-center justify-center gap-1 min-h-[40px] py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-[#AF9460]/50 hover:text-[#AF9460] active:scale-[0.98] touch-manipulation">
                    <Ruler size={10} /> Talla
                </button>
                <button onClick={() => onCambiarProducto(item)} className="flex-1 flex items-center justify-center gap-1 min-h-[40px] py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-[#AF9460]/50 hover:text-[#AF9460] active:scale-[0.98] touch-manipulation">
                    <RefreshCw size={10} /> Artículo
                </button>
            </div>
        </div>
    );
}

function ModalTalla({ item, onClose, onSave, saving }) {
    const [talla, setTalla] = useState(item?.talla ?? '');
    useEffect(() => { if (item) setTalla(item.talla ?? ''); }, [item]);
    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar talla" size="sm"
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
                <div className="space-y-3">
                    <p className="text-[11px] text-zinc-500">{item.descripcion}</p>
                    <input value={talla} onChange={(e) => setTalla(e.target.value.toUpperCase())} maxLength={10} placeholder="Ej. M, 27"
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25" />
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {TALLAS_COMUNES.map(t => (
                            <button key={t} type="button" onClick={() => setTalla(t)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${talla === t ? 'bg-[#AF9460] border-[#AF9460] text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
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
        const url = `/api/productos?all=1&search=${encodeURIComponent(debouncedSearch)}`;
        api.get(url).then(j => { setProductos(j.data ?? []); setLoadingP(false); }).catch(() => setLoadingP(false));
    }, [debouncedSearch, item]);

    return (
        <Modal open={!!item} onClose={onClose} title="Cambiar artículo" size="md"
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
                <div className="space-y-3">
                    <p className="text-[11px] text-zinc-500">Actual: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.descripcion}</span></p>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.8} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar artículo..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm" />
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800">
                        {loadingP ? (
                            <div className="py-6 flex justify-center"><span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" /></div>
                        ) : productos.length === 0 ? (
                            <p className="py-6 text-center text-[11px] text-zinc-400">Sin resultados.</p>
                        ) : (
                            productos.map(p => (
                                <button key={p.id} type="button" onClick={() => setSelected(p)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[11px] ${selected?.id === p.id ? 'bg-[#AF9460]/10 border-l-2 border-[#AF9460]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}`}>
                                    <span className="flex-1 truncate">{p.descripcion}</span>
                                    {selected?.id === p.id && <CheckCircle size={12} className="text-[#AF9460] shrink-0" strokeWidth={2} />}
                                </button>
                            ))
                        )}
                    </div>
                    {selected && (
                        <input value={talla} onChange={(e) => setTalla(e.target.value.toUpperCase())} maxLength={10} placeholder="Talla (opcional)"
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm" />
                    )}
                </div>
            )}
        </Modal>
    );
}

export default function VestuarioEmpleadoModal({ empleado, onClose, onSaved }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTalla, setEditTalla] = useState(null);
    const [cambiarProd, setCambiarProd] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback(() => {
        if (!empleado?.id) return;
        setLoading(true);
        setError(null);
        api.get(`/api/empleados/${empleado.id}/vestuario`)
            .then(res => { setData(res); setLoading(false); })
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
            load();
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
            load();
            onSaved?.();
        } catch (err) { setToast(err.message || 'Error'); }
        finally { setSaving(false); }
    };

    if (!empleado) return null;

    return (
        <>
            <Modal open={!!empleado} onClose={onClose} title="Vestuario" size="xl">
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{empleado.nombre_completo || 'Empleado'}</p>
                    {empleado.nue && (
                        <p className="text-[11px] text-zinc-500">NUE {empleado.nue} · {empleado.delegacion || ''}</p>
                    )}
                    {loading ? (
                        <div className="py-12 flex justify-center"><span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" /></div>
                    ) : error ? (
                        <p className="py-8 text-center text-sm text-red-500">{error}</p>
                    ) : !data?.asignaciones?.length ? (
                        <p className="py-8 text-center text-sm text-zinc-500">Sin asignaciones de vestuario.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.asignaciones.map(item => (
                                <PrendaCard key={item.id} item={item} onEditTalla={setEditTalla} onCambiarProducto={setCambiarProd} />
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            <ModalTalla item={editTalla} onClose={() => setEditTalla(null)} onSave={handleSaveTalla} saving={saving} />
            <ModalCambiarProducto item={cambiarProd} onClose={() => setCambiarProd(null)} onSave={handleSaveProducto} saving={saving} />

            {toast && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-lg">
                    <CheckCircle size={14} className="text-emerald-400 dark:text-emerald-600" strokeWidth={2} /> {toast}
                </div>
            )}
        </>
    );
}
