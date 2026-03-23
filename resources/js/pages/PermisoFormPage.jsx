/**
 * Vista para crear o editar un Permiso.
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

const EMPTY_FORM = { name: '', guard_name: 'web' };

const SUGGESTED_MODULES = [
    'dashboard', 'notificaciones', 'organizacion', 'catalogo', 'empleados',
    'selecciones', 'reportes', 'usuarios', 'roles', 'permisos', 'periodos',
    'dependencias', 'delegaciones', 'delegados', 'partidas', 'mi_delegacion',
    'inventario', 'solicitudes', 'asignaciones',
];
const SUGGESTED_ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'gestionar'];

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

export default function PermisoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [module, setModule] = useState('');
    const [action, setAction] = useState('');

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/permisos/${id}`)
            .then((res) => {
                const p = res.data ?? res;
                if (p) {
                    setForm({
                        name: p.name ?? '',
                        guard_name: p.guard_name ?? 'web',
                    });
                } else {
                    navigate('/dashboard/permisos', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/permisos', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    // Quick generator for create
    useEffect(() => {
        if (module && action) setForm((prev) => ({ ...prev, name: `${module}.${action}` }));
    }, [module, action]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/permisos/${id}`, form);
            } else {
                await api.post('/api/permisos', form);
            }
            navigate('/dashboard/permisos', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

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
                to="/dashboard/permisos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Permisos
            </Link>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Permiso' : 'Nuevo Permiso'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Control granular de acciones disponibles en el sistema
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    {!isEdit && (
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-3">
                            <p className="text-[13px] font-bold uppercase tracking-widest text-zinc-400">Generador Rápido</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[12px] text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">Módulo</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SUGGESTED_MODULES.map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setModule(m)}
                                                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold uppercase border transition-all min-h-[44px] sm:min-h-0 ${
                                                    module === m
                                                        ? 'bg-brand-gold border-brand-gold text-white'
                                                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-brand-gold/40'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">Acción</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SUGGESTED_ACTIONS.map((a) => (
                                            <button
                                                key={a}
                                                type="button"
                                                onClick={() => setAction(a)}
                                                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold uppercase border transition-all min-h-[44px] sm:min-h-0 ${
                                                    action === a
                                                        ? 'bg-brand-gold border-brand-gold text-white'
                                                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-brand-gold/40'
                                                }`}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Field label="Nombre (módulo.acción)" error={errors.name?.[0]}>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej. usuarios.crear"
                            required
                            className={inputClass}
                        />
                        <p className="text-[12px] text-zinc-400 mt-1">
                            Formato: <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">modulo.accion</code>
                        </p>
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

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/permisos"
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
