/**
 * Vista para crear o editar un Empleado.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, X, ChevronDown } from 'lucide-react';
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
    nue: '', nombre: '', apellido_paterno: '', apellido_materno: '',
    dependencia_clave: '', delegacion_clave: '', activo: true, user_id: '',
};

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";
const selectClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

export default function EmpleadoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [dependencias, setDependencias] = useState([]);
    const [delegaciones, setDelegaciones] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userLinked, setUserLinked] = useState(null);
    const userSearchTimer = useRef(null);

    useEffect(() => {
        api.get('/api/dependencias?search=').then(r => setDependencias(r.data ?? [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!form.dependencia_clave) { setDelegaciones([]); return; }
        api.get(`/api/delegaciones?ur=${form.dependencia_clave}`)
            .then(r => setDelegaciones(r.data ?? [])).catch(() => { });
    }, [form.dependencia_clave]);

    useEffect(() => {
        clearTimeout(userSearchTimer.current);
        if (!userSearch.trim()) { setUserResults([]); return; }
        userSearchTimer.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(userSearch)}&per_page=8`)
                .then(r => setUserResults(r.data ?? [])).catch(() => { });
        }, 350);
        return () => clearTimeout(userSearchTimer.current);
    }, [userSearch]);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/empleados/${id}`)
            .then((res) => {
                const e = res.data ?? res;
                if (e) {
                    setForm({
                        nue: e.nue ?? '',
                        nombre: e.nombre ?? '',
                        apellido_paterno: e.apellido_paterno ?? '',
                        apellido_materno: e.apellido_materno ?? '',
                        dependencia_clave: e.dependencia_clave ?? '',
                        delegacion_clave: e.delegacion_clave ?? '',
                        activo: true,
                        user_id: e.user_id ?? '',
                    });
                } else {
                    navigate('/dashboard/empleados', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/empleados', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const resetUserSearch = () => { setUserSearch(''); setUserResults([]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = { ...form, user_id: form.user_id || null };
            if (isEdit) {
                await api.put(`/api/empleados/${id}`, payload);
            } else {
                await api.post('/api/empleados', payload);
            }
            navigate('/dashboard/empleados', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
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
        <div className="mx-auto max-w-lg">
            <Link
                to="/dashboard/empleados"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Empleados
            </Link>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Registro de empleados vinculados al sistema de vestuario
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <Field label="NUE (Número Único de Empleado)" error={errors.nue?.[0]}>
                        <input
                            type="text"
                            value={form.nue}
                            onChange={f('nue')}
                            placeholder="Ej. 00012345"
                            maxLength={15}
                            required
                            className={inputClass}
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4">
                        <Field label="Apellido Paterno" error={errors.apellido_paterno?.[0]}>
                            <input
                                type="text"
                                value={form.apellido_paterno}
                                onChange={f('apellido_paterno')}
                                placeholder="Apellido paterno"
                                maxLength={80}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Apellido Materno" error={errors.apellido_materno?.[0]}>
                            <input
                                type="text"
                                value={form.apellido_materno}
                                onChange={f('apellido_materno')}
                                placeholder="Apellido materno"
                                maxLength={80}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Nombre(s)" error={errors.nombre?.[0]}>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={f('nombre')}
                                placeholder="Nombre(s)"
                                maxLength={80}
                                required
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Dependencia" error={errors.dependencia_clave?.[0]}>
                            <div className="relative">
                                <select
                                    value={form.dependencia_clave}
                                    onChange={(e) => setForm(p => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))}
                                    required
                                    className={`${selectClass} appearance-none pr-10 truncate min-w-0`}
                                >
                                    <option value="">Seleccionar…</option>
                                    {dependencias.map(d => (
                                        <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2} />
                            </div>
                        </Field>
                        <Field label="Delegación" error={errors.delegacion_clave?.[0]}>
                            <div className="relative">
                                <select
                                    value={form.delegacion_clave}
                                    onChange={f('delegacion_clave')}
                                    disabled={!form.dependencia_clave}
                                    required
                                    className={`${selectClass} appearance-none pr-10 truncate min-w-0`}
                                >
                                    <option value="">Seleccionar…</option>
                                    {delegaciones.map(d => (
                                        <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2} />
                            </div>
                        </Field>
                    </div>

                    <Field label="Vincular a usuario del sistema (opcional)" error={errors.user_id?.[0]}>
                        {userLinked ? (
                            <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-brand-gold/40 bg-brand-gold/5">
                                <div>
                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{userLinked.name}</p>
                                    <p className="text-[11px] text-zinc-400 font-mono">{userLinked.rfc}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }}
                                    className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all min-h-[44px] min-w-[44px]"
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                                    <input
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Buscar por nombre o RFC…"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                                {userResults.length > 0 && (
                                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60 overflow-hidden max-h-36 overflow-y-auto">
                                        {userResults.map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }}
                                                className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-brand-gold/5 transition-all min-h-[44px]"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{u.name}</p>
                                                    <p className="text-[11px] text-zinc-400 font-mono">{u.rfc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!userResults.length && userSearch && (
                                    <p className="text-[12px] text-zinc-400 px-1">Sin resultados.</p>
                                )}
                            </div>
                        )}
                    </Field>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all min-h-[44px]">
                        <span className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Empleado activo</span>
                        <div
                            onClick={(e) => { e.preventDefault(); setForm(p => ({ ...p, activo: !p.activo })); }}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.activo ? 'bg-brand-gold' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                        >
                            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${form.activo ? 'left-4' : 'left-0.5'}`} />
                        </div>
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/empleados"
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
