/**
 * Vista para crear o editar un Producto.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect } from 'react';
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
    partida: '', partida_especifica: '', lote: '', codigo: '',
    clave_vestuario: '', descripcion: '', marca: '', unidad: '', medida: '', activo: true,
};

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

export default function ProductoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/productos/${id}`)
            .then((res) => {
                const p = res.data ?? res;
                if (p) {
                    setForm({
                        partida: p.partida ?? '',
                        partida_especifica: p.partida_especifica ?? '',
                        lote: p.lote ?? '',
                        codigo: p.codigo ?? '',
                        clave_vestuario: p.clave_vestuario ?? p.codigo ?? '',
                        descripcion: p.descripcion ?? '',
                        marca: p.marca ?? '',
                        unidad: p.unidad ?? '',
                        medida: p.medida ?? '',
                        activo: p.activo ?? true,
                    });
                } else {
                    navigate('/dashboard/productos', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/productos', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/productos/${id}`, form);
            } else {
                await api.post('/api/productos', form);
            }
            navigate('/dashboard/productos', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const fCheck = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.checked }));

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg">
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
                        <Field label="Clave vestuario" error={errors.clave_vestuario?.[0]}>
                            <input
                                type="text"
                                value={form.clave_vestuario}
                                onChange={f('clave_vestuario')}
                                placeholder="Ej. CAL-EJE-01"
                                maxLength={30}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Código" error={errors.codigo?.[0]}>
                            <input
                                type="text"
                                value={form.codigo}
                                onChange={f('codigo')}
                                placeholder="Código interno"
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
                                maxLength={15}
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Partida" error={errors.partida?.[0]}>
                            <input
                                type="number"
                                value={form.partida}
                                onChange={f('partida')}
                                placeholder="Ej. 2711"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="P. Específica" error={errors.partida_especifica?.[0]}>
                            <input
                                type="number"
                                value={form.partida_especifica}
                                onChange={f('partida_especifica')}
                                placeholder="Ej. 01"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Lote" error={errors.lote?.[0]}>
                            <input
                                type="number"
                                value={form.lote}
                                onChange={f('lote')}
                                placeholder="Ej. 1"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all min-h-[44px]">
                        <span className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Producto activo en el catálogo</span>
                        <input
                            type="checkbox"
                            checked={form.activo}
                            onChange={fCheck('activo')}
                            className="rounded accent-brand-gold size-5"
                        />
                    </label>

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
                            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
