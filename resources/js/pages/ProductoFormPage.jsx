/**
 * Vista para crear o editar un Producto.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

const EMPTY_FORM = {
    descripcion: '', marca: '', unidad: '', medida: '',
    codigo: '', lote: '', proveedor_id: '', partida_id: '',
};

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";
const selectClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation appearance-none pr-10";

function fmtPrecio(v) {
    if (v == null || v === '') return '—';
    return `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProductoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [catalogBusy, setCatalogBusy] = useState(false);
    const [anioCatalogo, setAnioCatalogo] = useState(() => new Date().getFullYear());
    const [aniosSelector, setAniosSelector] = useState([]);
    const [ejClave, setEjClave] = useState('');
    const [ejPrecio, setEjPrecio] = useState('');
    const [tallasEj, setTallasEj] = useState([]);
    const [nuevaTalla, setNuevaTalla] = useState('');
    const [catalogMsg, setCatalogMsg] = useState('');
    const [catalogErr, setCatalogErr] = useState('');
    const [savingPrecio, setSavingPrecio] = useState(false);
    const [tallaBusyId, setTallaBusyId] = useState(null);

    const firstLoadForId = useRef(true);
    const prevIdRef = useRef(id);

    useEffect(() => {
        if (prevIdRef.current !== id) {
            prevIdRef.current = id;
            firstLoadForId.current = true;
            setAnioCatalogo(new Date().getFullYear());
        }
    }, [id]);

    const applyProductoPayload = (p) => {
        if (!p) return;
        setForm({
            descripcion: p.descripcion ?? '',
            marca: p.marca ?? '',
            unidad: p.unidad ?? '',
            medida: p.medida ?? '',
            codigo: p.codigo ?? '',
            lote: p.lote ?? '',
            proveedor_id: p.proveedor_id ?? '',
            partida_id: p.partida_id ?? '',
        });
        const cat = p.catalogo_ejercicio ?? {};
        setEjClave(cat.clave ?? '');
        setEjPrecio(cat.precio_unitario != null ? String(cat.precio_unitario) : '');
        setTallasEj(Array.isArray(cat.tallas) ? cat.tallas : []);
        const cur = new Date().getFullYear();
        const raw = Array.isArray(p.anios_selector) ? p.anios_selector : [];
        setAniosSelector([...new Set([cur, ...raw])].sort((a, b) => b - a));
    };

    useEffect(() => {
        if (!isEdit) {
            setLoading(false);
            return;
        }

        const onlyAnio = !firstLoadForId.current;
        if (onlyAnio) setCatalogBusy(true);
        else setLoading(true);

        let cancelled = false;
        api.get(`/api/productos/${id}?anio=${anioCatalogo}`)
            .then((res) => {
                const p = res?.data ?? res;
                if (cancelled || !p) return;
                applyProductoPayload(p);
            })
            .catch(() => {
                if (!cancelled) navigate('/dashboard/productos', { replace: true });
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
                setCatalogBusy(false);
                firstLoadForId.current = false;
            });

        return () => { cancelled = true; };
    }, [id, isEdit, navigate, anioCatalogo]);

    const reloadCatalogo = async () => {
        setCatalogBusy(true);
        setCatalogErr('');
        try {
            const res = await api.get(`/api/productos/${id}?anio=${anioCatalogo}`);
            const p = res?.data ?? res;
            applyProductoPayload(p);
        } catch (e) {
            setCatalogErr(e.message || 'No se pudo actualizar el catálogo.');
        } finally {
            setCatalogBusy(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = { ...form };
            if (isEdit) {
                await api.put(`/api/productos/${id}`, payload);
            } else {
                await api.post('/api/productos', payload);
            }
            navigate('/dashboard/productos', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleGuardarPrecio = async () => {
        setCatalogErr('');
        setCatalogMsg('');
        setSavingPrecio(true);
        try {
            await api.put(`/api/productos/${id}/precio-ejercicio`, {
                anio: anioCatalogo,
                clave: ejClave.trim(),
                precio_unitario: Number(String(ejPrecio).replace(',', '.')),
            });
            setCatalogMsg('Precio guardado para el ejercicio ' + anioCatalogo + '.');
            await reloadCatalogo();
        } catch (err) {
            setCatalogErr(err.message || 'Error al guardar precio.');
        } finally {
            setSavingPrecio(false);
        }
    };

    const handleAgregarTalla = async () => {
        const t = nuevaTalla.trim();
        if (!t) return;
        setCatalogErr('');
        setCatalogMsg('');
        setTallaBusyId('new');
        try {
            await api.post(`/api/productos/${id}/talla-ejercicio`, { anio: anioCatalogo, talla: t });
            setNuevaTalla('');
            setCatalogMsg('Talla agregada.');
            await reloadCatalogo();
        } catch (err) {
            setCatalogErr(err.message || 'No se pudo agregar la talla.');
        } finally {
            setTallaBusyId(null);
        }
    };

    const handleQuitarTalla = async (productoTallaId) => {
        setCatalogErr('');
        setCatalogMsg('');
        setTallaBusyId(productoTallaId);
        try {
            await api.delete(`/api/productos/${id}/talla-ejercicio/${productoTallaId}`);
            setCatalogMsg('Talla eliminada del ejercicio.');
            await reloadCatalogo();
        } catch (err) {
            setCatalogErr(err.message || 'No se pudo quitar la talla.');
        } finally {
            setTallaBusyId(null);
        }
    };

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                to="/dashboard/productos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Productos
            </Link>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Catálogo de artículos de vestuario y calzado
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <Field label="Descripción" error={errors.descripcion?.[0]}>
                        <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={f('descripcion')}
                            placeholder="Descripción completa del artículo"
                            className={`${inputClass} resize-none`}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Código" error={errors.codigo?.[0]}>
                            <input
                                type="text"
                                value={form.codigo}
                                onChange={f('codigo')}
                                placeholder="Ej. CAL-EJE-01"
                                maxLength={30}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Marca" error={errors.marca?.[0]}>
                            <input
                                type="text"
                                value={form.marca}
                                onChange={f('marca')}
                                placeholder="Marca"
                                maxLength={80}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Unidad" error={errors.unidad?.[0]}>
                            <input
                                type="text"
                                value={form.unidad}
                                onChange={f('unidad')}
                                placeholder="Par, Pza, Jgo…"
                                maxLength={50}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Medida" error={errors.medida?.[0]}>
                            <input
                                type="text"
                                value={form.medida}
                                onChange={f('medida')}
                                placeholder="cm, talla…"
                                maxLength={10}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Lote" error={errors.lote?.[0]}>
                            <input
                                type="text"
                                value={form.lote}
                                onChange={f('lote')}
                                placeholder="Ej. 1"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    {isEdit && (
                        <div className={`rounded-xl border border-zinc-200 dark:border-zinc-700/80 p-4 space-y-4 ${catalogBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    Precio y tallas por ejercicio
                                </h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-bold uppercase text-zinc-500">Año</label>
                                    <select
                                        value={anioCatalogo}
                                        onChange={(e) => setAnioCatalogo(Number(e.target.value))}
                                        className={`${selectClass} py-2 max-w-[120px]`}
                                    >
                                        {(aniosSelector.length ? aniosSelector : [new Date().getFullYear()]).map((a) => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {catalogMsg && (
                                <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">{catalogMsg}</p>
                            )}
                            {catalogErr && (
                                <p className="text-[12px] text-red-500">{catalogErr}</p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                <Field label="Clave (catálogo / vestuario)">
                                    <input
                                        type="text"
                                        value={ejClave}
                                        onChange={(e) => setEjClave(e.target.value)}
                                        maxLength={30}
                                        className={inputClass}
                                        placeholder="Clave del ejercicio"
                                    />
                                </Field>
                                <Field label={`Precio unitario (${anioCatalogo})`}>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={ejPrecio}
                                        onChange={(e) => setEjPrecio(e.target.value)}
                                        className={inputClass}
                                        placeholder="0.00"
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => handleGuardarPrecio()}
                                        disabled={savingPrecio || catalogBusy}
                                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-brand-gold text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                                    >
                                        {savingPrecio ? 'Guardando precio…' : 'Guardar precio del ejercicio'}
                                    </button>
                                    <p className="text-[11px] text-zinc-500 mt-2">
                                        Vista previa: {fmtPrecio(ejPrecio === '' ? null : Number(String(ejPrecio).replace(',', '.')))}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">Tallas para {anioCatalogo}</h4>
                                {tallasEj.length === 0 ? (
                                    <p className="text-[13px] text-zinc-500">Sin tallas para este ejercicio. Agrega una abajo.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {tallasEj.map((t) => (
                                            <li
                                                key={t.id}
                                                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2"
                                            >
                                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t.talla}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuitarTalla(t.id)}
                                                    disabled={tallaBusyId != null || catalogBusy}
                                                    className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-40"
                                                >
                                                    {tallaBusyId === t.id ? '…' : 'Quitar'}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Nueva talla</label>
                                        <input
                                            type="text"
                                            value={nuevaTalla}
                                            onChange={(e) => setNuevaTalla(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAgregarTalla();
                                                }
                                            }}
                                            className={inputClass}
                                            placeholder="Ej. 28, M, GDE…"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAgregarTalla()}
                                        disabled={tallaBusyId != null || catalogBusy}
                                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                        {tallaBusyId === 'new' ? 'Agregando…' : 'Agregar talla'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/productos"
                            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all touch-manipulation"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all touch-manipulation"
                        >
                            {saving ? 'Guardando…' : isEdit ? 'Guardar datos del producto' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
