/**
 * Vista para crear o editar una Delegación (pantalla completa).
 * UR: rejilla minimalista de tarjetas seleccionables + filtro discreto.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

const inputClass = 'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';

export default function DelegacionFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({ clave: '', nombre: '' });
    const [dependencias, setDependencias] = useState([]);
    const [depSearch, setDepSearch] = useState('');
    const [dependenciaClaves, setDependenciaClaves] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        api.get('/api/dependencias?search=')
            .then((r) => setDependencias(r.data ?? []))
            .catch(() => setDependencias([]));
    }, []);

    useEffect(() => {
        if (!isEdit) {
            setLoading(false);
            return;
        }
        api.get(`/api/delegaciones/${id}`)
            .then((res) => {
                const d = res.data;
                if (d?.clave != null) {
                    setForm({ clave: d.clave ?? '', nombre: d.nombre ?? '' });
                    const deps = Array.isArray(d.dependencias) ? d.dependencias : [];
                    setDependenciaClaves(deps.map((x) => x.clave).filter(Boolean));
                } else {
                    navigate('/dashboard/delegaciones', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/delegaciones', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const dependenciasOrdenadas = useMemo(
        () => [...dependencias].sort((a, b) => String(a.clave ?? '').localeCompare(String(b.clave ?? ''), 'es', { sensitivity: 'base' })),
        [dependencias],
    );

    const dependenciasFiltradas = useMemo(() => {
        const q = depSearch.trim().toLowerCase();
        if (!q) return dependenciasOrdenadas;
        return dependenciasOrdenadas.filter((d) => {
            const clave = String(d.clave ?? '').toLowerCase();
            const nombre = String(d.nombre ?? '').toLowerCase();
            return clave.includes(q) || nombre.includes(q);
        });
    }, [dependenciasOrdenadas, depSearch]);

    /** Agrupar por primera letra/número de clave para lectura ordenada */
    const gruposUr = useMemo(() => {
        const m = new Map();
        dependenciasFiltradas.forEach((d) => {
            const c = String(d.clave ?? '?');
            const g = /^[0-9]/.test(c) ? '0–9' : (c[0] || '?').toUpperCase();
            if (!m.has(g)) m.set(g, []);
            m.get(g).push(d);
        });
        return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
    }, [dependenciasFiltradas]);

    const toggleDependencia = (clave) => {
        setDependenciaClaves((prev) =>
            prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave],
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (dependenciaClaves.length === 0) {
            setErrors({
                dependencia_claves: ['Seleccione al menos una unidad responsable (UR).'],
            });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                dependencia_claves: dependenciaClaves,
            };
            if (isEdit) {
                await api.put(`/api/delegaciones/${id}`, payload);
            } else {
                await api.post('/api/delegaciones', payload);
            }
            navigate('/dashboard/delegaciones', { replace: true });
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
        <div className="mx-auto w-full max-w-5xl px-1 sm:px-2">
            <Link
                to="/dashboard/delegaciones"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Delegaciones
            </Link>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar delegación' : 'Nueva delegación'}
                    </h2>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                        Defina la clave y las UR en las que opera. Pulse una tarjeta para incluirla o quitarla.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
                        <div className="space-y-4 min-w-0">
                            <Field label="Clave" error={errors.clave?.[0]}>
                                <input
                                    type="text"
                                    value={form.clave}
                                    onChange={(e) => setForm({ ...form, clave: e.target.value.toUpperCase() })}
                                    placeholder="Ej. 3B-101"
                                    maxLength={20}
                                    required
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Nombre (opcional)" error={errors.nombre?.[0]}>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    placeholder="Nombre descriptivo"
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Unidades responsables (UR)
                                    </p>
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                        {dependenciaClaves.length > 0 ? (
                                            <span className="tabular-nums text-zinc-600 dark:text-zinc-300">{dependenciaClaves.length} seleccionada{dependenciaClaves.length === 1 ? '' : 's'}</span>
                                        ) : (
                                            <span>Elija al menos una</span>
                                        )}
                                    </p>
                                </div>
                                <div className="w-full sm:max-w-xs">
                                    <input
                                        type="search"
                                        value={depSearch}
                                        onChange={(e) => setDepSearch(e.target.value)}
                                        placeholder="Filtrar…"
                                        autoComplete="off"
                                        className="w-full border-0 border-b border-zinc-200 bg-transparent py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-brand-gold/50 focus:ring-0 dark:border-zinc-700 dark:text-zinc-100"
                                        aria-label="Filtrar dependencias"
                                    />
                                </div>
                            </div>
                            {(errors.dependencia_claves?.[0] || errors['dependencia_claves.0']?.[0]) && (
                                <p className="text-[11px] text-red-500 mt-2">{errors.dependencia_claves?.[0] || errors['dependencia_claves.0']?.[0]}</p>
                            )}

                            {dependencias.length === 0 ? (
                                <p className="mt-4 text-[12px] text-amber-800 dark:text-amber-200/90 bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 rounded-xl px-3 py-2.5">
                                    No hay UR en el catálogo. Cree una en{' '}
                                    <Link to="/dashboard/dependencias/nueva" className="font-semibold underline">
                                        Dependencias
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <div className="mt-4 max-h-[min(56vh,28rem)] overflow-y-auto overscroll-y-contain pr-1 -mr-1">
                                    {dependenciasFiltradas.length === 0 ? (
                                        <p className="py-10 text-center text-[13px] text-zinc-500">Sin coincidencias.</p>
                                    ) : (
                                        <div className="space-y-6">
                                            {gruposUr.map(([letra, items]) => (
                                                <div key={letra}>
                                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                                        {letra}
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {items.map((d) => {
                                                            const on = dependenciaClaves.includes(d.clave);
                                                            return (
                                                                <button
                                                                    key={d.clave}
                                                                    type="button"
                                                                    onClick={() => toggleDependencia(d.clave)}
                                                                    aria-pressed={on}
                                                                    className={[
                                                                        'rounded-xl px-3 py-2.5 text-left transition-all duration-150',
                                                                        on
                                                                            ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                                                                            : 'border border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-600',
                                                                    ].join(' ')}
                                                                >
                                                                    <span className="block font-mono text-[12px] font-semibold tracking-wide">
                                                                        {d.clave}
                                                                    </span>
                                                                    {d.nombre ? (
                                                                        <span
                                                                            className={[
                                                                                'mt-0.5 block text-[11px] leading-snug line-clamp-2',
                                                                                on ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400',
                                                                            ].join(' ')}
                                                                        >
                                                                            {d.nombre}
                                                                        </span>
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800/80 sm:flex-row sm:justify-end">
                        <Link
                            to="/dashboard/delegaciones"
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-auto touch-manipulation"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || dependencias.length === 0}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto touch-manipulation"
                        >
                            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
