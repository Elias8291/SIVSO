/**
 * Vista para crear o editar un Rol.
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

const EMPTY_FORM = { name: '', guard_name: 'web', permissions: [] };

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/40 transition-all touch-manipulation";

function groupPermisos(permisos) {
    return permisos.reduce((acc, p) => {
        const [module] = (p.name || '').split('.');
        if (!module) return acc;
        if (!acc[module]) acc[module] = [];
        acc[module].push(p);
        return acc;
    }, {});
}

export default function RolFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [permisos, setPermisos] = useState([]);

    useEffect(() => {
        api.get('/api/permisos?all=1')
            .then((r) => setPermisos(r.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/roles/${id}`)
            .then((res) => {
                const r = res.data ?? res;
                if (r) {
                    setForm({
                        name: r.name ?? '',
                        guard_name: r.guard_name ?? 'web',
                        permissions: (r.permissions ?? []).map(Number),
                    });
                } else {
                    navigate('/dashboard/roles', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/roles', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/roles/${id}`, form);
            } else {
                await api.post('/api/roles', form);
            }
            navigate('/dashboard/roles', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const togglePermiso = (permId) =>
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter((p) => p !== permId)
                : [...prev.permissions, permId],
        }));

    const toggleModulo = (modPermisos) => {
        const ids = modPermisos.map((p) => p.id);
        const allSelected = ids.every((pid) => form.permissions.includes(pid));
        setForm((prev) => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter((p) => !ids.includes(p))
                : [...new Set([...prev.permissions, ...ids])],
        }));
    };

    const groups = groupPermisos(permisos);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                to="/dashboard/roles"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#AF9460] mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Roles
            </Link>

            <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Rol' : 'Nuevo Rol'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Grupos de permisos asignables a usuarios del sistema
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre del Rol" error={errors.name?.[0]}>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej. editor, supervisor"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Guard" error={errors.guard_name?.[0]}>
                            <input
                                type="text"
                                value={form.guard_name}
                                onChange={(e) => setForm({ ...form, guard_name: e.target.value })}
                                placeholder="web"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label={`Permisos (${form.permissions.length} seleccionados)`} error={errors.permissions?.[0]}>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {Object.entries(groups).map(([module, modPermisos]) => {
                                const allSelected = modPermisos.every((p) => form.permissions.includes(p.id));
                                const someSelected = modPermisos.some((p) => form.permissions.includes(p.id));
                                return (
                                    <div key={module} className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleModulo(modPermisos)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px]"
                                        >
                                            <span className="text-[13px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 capitalize">
                                                {module}
                                            </span>
                                            <span
                                                className={`size-4 rounded border-2 flex items-center justify-center transition-all ${
                                                    allSelected
                                                        ? 'bg-[#AF9460] border-[#AF9460]'
                                                        : someSelected
                                                            ? 'border-[#AF9460]'
                                                            : 'border-zinc-300 dark:border-zinc-600'
                                                }`}
                                            >
                                                {allSelected && (
                                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                                {someSelected && !allSelected && <span className="size-1.5 rounded-sm bg-[#AF9460] block" />}
                                            </span>
                                        </button>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                                            {modPermisos.map((p) => (
                                                <label
                                                    key={p.id}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all min-h-[44px] text-[13px] font-medium ${
                                                        form.permissions.includes(p.id)
                                                            ? 'bg-[#AF9460]/8 text-[#AF9460] border border-[#AF9460]/20'
                                                            : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={form.permissions.includes(p.id)}
                                                        onChange={() => togglePermiso(p.id)}
                                                    />
                                                    <span
                                                        className={`size-3.5 rounded border flex items-center justify-center shrink-0 ${
                                                            form.permissions.includes(p.id) ? 'bg-[#AF9460] border-[#AF9460]' : 'border-zinc-300 dark:border-zinc-600'
                                                        }`}
                                                    >
                                                        {form.permissions.includes(p.id) && (
                                                            <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    {(p.name || '').split('.')[1] || p.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {permisos.length === 0 && (
                                <p className="text-xs text-zinc-400 text-center py-4">No hay permisos registrados aún.</p>
                            )}
                        </div>
                    </Field>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/roles"
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
