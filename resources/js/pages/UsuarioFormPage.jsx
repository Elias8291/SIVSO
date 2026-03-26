/**
 * Vista para crear o editar un Usuario.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Card } from '../components/ui';

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

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

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
        api.get('/api/roles?all=1')
            .then((r) => setRoles(Array.isArray(r.data) ? r.data : []))
            .catch(() => setRoles([]));
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
                        roles: (u.roles ?? []).map((r) => Number(typeof r === 'object' ? r.id : r)).filter((v) => Number.isFinite(v)),
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

    const toggleRole = (roleIdRaw) => {
        const roleId = Number(roleIdRaw);
        if (!Number.isFinite(roleId)) return;
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter((r) => r !== roleId)
                : [...prev.roles, roleId],
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-2">
            <Link
                to="/dashboard/usuarios"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Usuarios
            </Link>

            <PageHeader
                title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
                description="RFC como usuario de acceso, roles y estado de la cuenta."
            />

            <Card className="mt-8 shadow-sm">
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                    {errors.general && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50">
                            {errors.general}
                        </p>
                    )}

                    <Field label="Nombre completo" error={errors.name?.[0]}>
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
                        <Field label="Correo electrónico" error={errors.email?.[0]}>
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
                                            ? 'border-brand-gold/40 bg-brand-gold/8 text-brand-gold'
                                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
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
                                            form.roles.includes(role.id) ? 'bg-brand-gold border-brand-gold' : 'border-zinc-300 dark:border-zinc-600'
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

                    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all min-h-[52px]">
                        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Usuario activo</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.activo}
                            onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                            className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${form.activo ? 'bg-brand-gold' : 'bg-zinc-200 dark:bg-zinc-600'}`}
                        >
                            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${form.activo ? 'left-5' : 'left-0.5'}`} />
                        </button>
                    </label>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link
                            to="/dashboard/usuarios"
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-auto touch-manipulation"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto min-w-[9rem] touch-manipulation"
                        >
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
