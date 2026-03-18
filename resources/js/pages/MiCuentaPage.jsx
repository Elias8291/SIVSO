import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Hash, CheckCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { api } from '../lib/api';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1">
            <label className="block text-[13px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {error && <p className="text-[13px] text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

function Inp({ ...props }) {
    return (
        <input
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/20 focus:border-[#AF9460]/40 transition-all"
            {...props}
        />
    );
}

function SectionCard({ icon: Icon, title, description, children }) {
    return (
        <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="px-3 sm:px-4 py-3 border-b border-zinc-50 dark:border-zinc-800/60 flex items-center gap-2.5 text-left">
                <div className="size-7 rounded-lg bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[#AF9460]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{title}</p>
                    {description && <p className="text-[13px] text-zinc-400 mt-0.5 line-clamp-1">{description}</p>}
                </div>
            </div>
            <div className="px-3 sm:px-4 py-3 text-left">
                {children}
            </div>
        </div>
    );
}

function Toast({ message, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl text-[12px] font-semibold animate-in slide-in-from-bottom-2">
            <CheckCircle size={15} strokeWidth={2} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            {message}
        </div>
    );
}

export default function MiCuentaPage() {
    const [profile, setProfile]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [toast, setToast]         = useState(null);

    // Formulario datos personales
    const [formInfo, setFormInfo]   = useState({ name: '', rfc: '', email: '' });
    const [errInfo, setErrInfo]     = useState({});
    const [savingInfo, setSavingInfo] = useState(false);

    // Formulario NUE (solo si tiene empleado)
    const [formNue, setFormNue]     = useState({ nue: '' });
    const [errNue, setErrNue]       = useState({});
    const [savingNue, setSavingNue] = useState(false);

    useEffect(() => {
        api.get('/api/perfil')
            .then((res) => {
                setProfile(res);
                setFormInfo({
                    name:  res.user?.name  ?? '',
                    rfc:   res.user?.rfc   ?? '',
                    email: res.user?.email ?? '',
                });
                setFormNue({ nue: res.empleado?.nue ?? res.user?.nue ?? '' });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const showToast = (msg) => setToast(msg);

    const saveInfo = async (e) => {
        e.preventDefault(); setSavingInfo(true); setErrInfo({});
        try {
            await api.put('/api/perfil', formInfo);
            showToast('Datos actualizados correctamente.');
        } catch (err) { setErrInfo(err.errors ?? { general: err.message }); }
        finally { setSavingInfo(false); }
    };

    const saveNue = async (e) => {
        e.preventDefault(); setSavingNue(true); setErrNue({});
        try {
            await api.put('/api/perfil/nue', formNue);
            showToast('NUE actualizado correctamente.');
        } catch (err) { setErrNue(err.errors ?? { general: err.message }); }
        finally { setSavingNue(false); }
    };

    const initials = profile?.user?.name
        ?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

    return (
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-0 text-center sm:text-left">
            <PageHeader
                title="Mi Cuenta"
                description="Gestiona tu información personal y credenciales de acceso."
                compact
            />

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3 lg:space-y-4">
                    {/* Avatar + resumen compacto */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 px-3 sm:px-4 py-3 bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-xl text-center sm:text-left">
                        <div className="size-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <span className="text-base font-black text-[#AF9460]">{initials}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold text-zinc-900 dark:text-white leading-tight truncate">
                                {profile?.user?.name ?? 'Usuario'}
                            </p>
                            <p className="text-[13px] text-zinc-400 mt-0.5 truncate">{profile?.user?.email ?? '—'}</p>
                            {(profile?.user?.nue || profile?.empleado) && (
                                <span className="inline-flex items-center justify-center sm:justify-start gap-1 mt-1 text-[12px] font-semibold text-[#AF9460] bg-[#AF9460]/10 px-2 py-0.5 rounded-full">
                                    <Hash size={10} strokeWidth={2.5} />
                                    NUE {profile?.empleado?.nue ?? profile?.user?.nue}
                                    {profile?.empleado?.delegacion_clave && ` · ${profile.empleado.delegacion_clave}`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Datos + NUE en grid 2 cols en escritorio */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                        <SectionCard icon={User} title="Datos personales" description="Nombre, RFC y correo electrónico.">
                            <form onSubmit={saveInfo} className="space-y-3">
                                {errInfo.general && (
                                    <p className="text-[14px] text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">{errInfo.general}</p>
                                )}
                                <Field label="Nombre completo" error={errInfo.name}>
                                    <Inp value={formInfo.name} onChange={(e) => setFormInfo({ ...formInfo, name: e.target.value })} placeholder="Nombre completo" />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="RFC" error={errInfo.rfc}>
                                        <Inp value={formInfo.rfc} onChange={(e) => setFormInfo({ ...formInfo, rfc: e.target.value.toUpperCase() })} placeholder="RFC" maxLength={20} />
                                    </Field>
                                    <Field label="Correo electrónico" error={errInfo.email}>
                                        <Inp type="email" value={formInfo.email} onChange={(e) => setFormInfo({ ...formInfo, email: e.target.value })} placeholder="correo@ejemplo.com" />
                                    </Field>
                                </div>
                                <div className="flex justify-center sm:justify-end pt-0.5">
                                    <button type="submit" disabled={savingInfo}
                                        className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                                        {savingInfo ? 'Guardando…' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                        {/* NUE — siempre visible para vincularse al padrón */}
                        {(profile?.empleado || profile !== null) && (
                            <SectionCard icon={Hash} title="Número Único de Empleado"
                                description={profile?.empleado ? `Vinculado · ${profile.empleado.delegacion_clave ?? ''} · ${profile.empleado.dependencia_nombre ?? ''}` : 'Vincula tu cuenta al padrón de trabajadores.'}>
                                <form onSubmit={saveNue} className="space-y-3">
                                    {errNue.general && (
                                        <p className="text-[14px] text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">{errNue.general}</p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {profile?.empleado && (
                                            <Field label="NUE actual">
                                                <Inp value={profile.empleado.nue ?? '—'} disabled className="opacity-60 cursor-not-allowed" />
                                            </Field>
                                        )}
                                        <Field label={profile?.empleado ? 'Nuevo NUE' : 'Tu NUE'} error={errNue.nue?.[0] ?? errNue.nue}>
                                            <Inp value={formNue.nue} onChange={(e) => setFormNue({ nue: e.target.value })} placeholder="Ej. 00012345" maxLength={15} />
                                        </Field>
                                    </div>
                                    <div className="flex justify-center sm:justify-end pt-0.5">
                                        <button type="submit" disabled={savingNue}
                                            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                                            {savingNue ? 'Guardando…' : 'Actualizar NUE'}
                                        </button>
                                    </div>
                                </form>
                            </SectionCard>
                        )}
                    </div>

                    {/* Cambiar contraseña — compacto */}
                    <Link
                        to="/dashboard/mi-cuenta/cambiar-contrasena"
                        className="block bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-xl overflow-hidden hover:border-[#AF9460]/30 dark:hover:border-[#AF9460]/30 transition-colors group"
                    >
                        <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-7 rounded-lg bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                                    <KeyRound size={14} className="text-[#AF9460]" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-[#AF9460] transition-colors">Cambiar contraseña</p>
                                    <p className="text-[13px] text-zinc-400">Actualiza tu contraseña de acceso</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-[#AF9460] shrink-0" />
                        </div>
                    </Link>
                </div>
            )}

            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
