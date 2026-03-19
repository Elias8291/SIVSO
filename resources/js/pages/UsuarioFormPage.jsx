/**
 * Vista para crear o editar un Usuario.
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

const EMPTY_FORM = { name: '', rfc: '', email: '', password: '', activo: true, roles: [] };

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/40 transition-all touch-manipulation";

export default function UsuarioFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        api.get('/api/roles?all=1').then((r) => setRoles(r.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/usuarios/${id}`)
            .then((res) => {
                const u = res.data ?? res;
                if (u) {
                    setForm({
                        name: u.name ?? '',
                        rfc: u.rfc ?? '',
                        email: u.email ?? '',
                        password: '',
                        activo: u.activo ?? true,
                        roles: (u.roles ?? []).map((r) => typeof r === 'object' ? r.id : r),
                    });
                } else {
                    navigate('/dashboard/usuarios', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/usuarios', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/usuarios/${id}`, form);
            } else {
                await api.post('/api/usuarios', form);
            }
            navigate('/dashboard/usuarios', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const toggleRole = (roleId) =>
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter((r) => r !== roleId)
                : [...prev.roles, roleId],
        }));

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
                to="/dashboard/usuarios"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#AF9460] mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Usuarios
            </Link>

            <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Gestión de cuentas de acceso al sistema
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {errors.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {errors.general}
                        </p>
                    )}

                    <Field label="Nombre Completo" error={errors.name?.[0]}>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej. Juan Pérez Ramos"
                            required
                            className={inputClass}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="RFC" error={errors.rfc?.[0]}>
                            <input
                                type="text"
                                value={form.rfc}
                                onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                                placeholder="PERJ880214XYZ"
                                maxLength={20}
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Correo Electrónico" error={errors.email?.[0]}>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="correo@dominio.com"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <Field label={isEdit ? 'Contraseña (vacío = sin cambio)' : 'Contraseña'} error={errors.password?.[0]}>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            required={!isEdit}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Roles" error={errors.roles?.[0]}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {roles.map((role) => (
                                <label
                                    key={role.id}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                                        form.roles.includes(role.id)
                                            ? 'border-[#AF9460]/40 bg-[#AF9460]/8 text-[#AF9460]'
                                            : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={form.roles.includes(role.id)}
                                        onChange={() => toggleRole(role.id)}
                                    />
                                    <span
                                        className={`size-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                            form.roles.includes(role.id) ? 'bg-[#AF9460] border-[#AF9460]' : 'border-zinc-300 dark:border-zinc-600'
                                        }`}
                                    >
                                        {form.roles.includes(role.id) && (
                                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="text-[14px] font-semibold">{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </Field>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all min-h-[44px]">
                        <span className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Usuario activo</span>
                        <div
                            onClick={(e) => { e.preventDefault(); setForm((p) => ({ ...p, activo: !p.activo })); }}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.activo ? 'bg-[#AF9460]' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                        >
                            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${form.activo ? 'left-4' : 'left-0.5'}`} />
                        </div>
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <Link
                            to="/dashboard/usuarios"
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
