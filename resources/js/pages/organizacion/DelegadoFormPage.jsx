/**
 * Vista para crear o editar un Delegado.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';

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

export default function DelegadoFormPage() {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const urClave = state?.ur ?? state?.dep?.clave ?? new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('ur');
    const initialItem = state?.item;

    const [form, setForm] = useState({ nombre: '', delegacion: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit && !initialItem);

    useEffect(() => {
        if (!isEdit) {
            if (!urClave) navigate('/dashboard/organizacion', { replace: true });
            return;
        }
        if (initialItem) {
            setForm({ nombre: initialItem.nombre, delegacion: initialItem.clave });
            setLoading(false);
            return;
        }
        const ur = state?.dep?.clave ?? urClave;
        api.get(ur ? `/api/delegados?ur=${ur}` : '/api/delegados')
            .then((res) => {
                const del = (res.data ?? []).find((d) => String(d.id) === id);
                if (del) setForm({ nombre: del.nombre, delegacion: del.clave });
                else navigate('/dashboard/organizacion', { replace: true });
            })
            .catch(() => navigate('/dashboard/organizacion', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, initialItem, urClave, state?.dep?.clave, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!urClave && !isEdit) return;
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/delegados/${id}`, form);
            } else {
                await api.post('/api/delegados', { ...form, ur: urClave });
            }
            navigate('/dashboard/organizacion', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (!urClave && !isEdit) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg">
            <Link
                to="/dashboard/organizacion"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#AF9460] mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Organización
            </Link>

            <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Delegado' : 'Nuevo Delegado'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {isEdit ? 'Modifica los datos del delegado' : `UR ${urClave}`}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <Field label="Nombre completo" error={errors.nombre?.[0]}>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                            placeholder="Ej. JUAN PÉREZ LÓPEZ"
                            maxLength={120}
                            required
                            className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/40 transition-all touch-manipulation"
                        />
                    </Field>

                    <Field label="Código de delegación (sin guión)" error={errors.delegacion?.[0]}>
                        <input
                            type="text"
                            value={form.delegacion}
                            onChange={(e) => setForm({ ...form, delegacion: e.target.value.toUpperCase() })}
                            placeholder="Ej. 3B101"
                            maxLength={25}
                            required
                            className="w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/40 transition-all touch-manipulation"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">
                            Corresponde al código sin guión (ej: 3B-101 → 3B101)
                        </p>
                    </Field>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/organizacion"
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
