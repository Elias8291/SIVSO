import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PageHeader, Card } from '../components/ui';

const inputClass =
    'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';

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

export default function MiCuentaPage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(t);
    }, [toast]);

    const [formInfo, setFormInfo] = useState({ name: '', rfc: '', email: '' });
    const [errInfo, setErrInfo] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);

    const [nue, setNue] = useState('');
    const [errNue, setErrNue] = useState(null);
    const [savingNue, setSavingNue] = useState(false);

    useEffect(() => {
        api.get('/api/perfil')
            .then((res) => {
                setProfile(res);
                setFormInfo({
                    name: res.user?.name ?? '',
                    rfc: res.user?.rfc ?? '',
                    email: res.user?.email ?? '',
                });
                setNue(res.empleado?.nue ?? res.user?.nue ?? '');
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const saveNue = async () => {
        setSavingNue(true);
        setErrNue(null);
        try {
            await api.put('/api/perfil/nue', { nue });
            setToast('NUE actualizado');
            const res = await api.get('/api/perfil');
            setProfile(res);
        } catch (err) {
            setErrNue(err.errors?.nue?.[0] ?? err.message);
        } finally {
            setSavingNue(false);
        }
    };

    const saveInfo = async (e) => {
        e.preventDefault();
        setSavingInfo(true);
        setErrInfo({});
        try {
            await api.put('/api/perfil', formInfo);
            setToast('Datos actualizados');
        } catch (err) {
            setErrInfo(err.errors ?? { general: err.message });
        } finally {
            setSavingInfo(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl pb-12">
            <PageHeader
                title="Mi cuenta"
                description="Perfil, NUE y seguridad de tu sesión."
            />

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="size-7 border-2 border-zinc-200 dark:border-zinc-700 border-t-brand-gold rounded-full animate-spin" />
                </div>
            ) : (
                <div className="mt-8 space-y-6">
                    <Card title="Perfil">
                        <form onSubmit={saveInfo} className="p-5 sm:p-6 space-y-5">
                            {errInfo.general && (
                                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50">
                                    {Array.isArray(errInfo.general) ? errInfo.general[0] : errInfo.general}
                                </p>
                            )}

                            <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 border-l-2 border-brand-gold/50 pl-3">
                                El <strong className="text-zinc-800 dark:text-zinc-200">RFC</strong> es tu usuario de acceso. El correo es opcional y sirve para notificaciones.
                            </p>

                            <Field label="Nombre completo" error={errInfo.name?.[0]}>
                                <input
                                    type="text"
                                    value={formInfo.name}
                                    onChange={(e) => setFormInfo({ ...formInfo, name: e.target.value })}
                                    placeholder="Nombre y apellidos"
                                    className={inputClass}
                                />
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                <Field label="RFC" error={errInfo.rfc?.[0]}>
                                    <input
                                        type="text"
                                        value={formInfo.rfc}
                                        onChange={(e) => setFormInfo({ ...formInfo, rfc: e.target.value.toUpperCase() })}
                                        placeholder="RFC"
                                        maxLength={20}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Correo electrónico" error={errInfo.email?.[0]}>
                                    <input
                                        type="email"
                                        value={formInfo.email}
                                        onChange={(e) => setFormInfo({ ...formInfo, email: e.target.value })}
                                        placeholder="correo@ejemplo.com"
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={savingInfo}
                                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 touch-manipulation"
                                >
                                    {savingInfo ? 'Guardando…' : 'Guardar perfil'}
                                </button>
                            </div>
                        </form>
                    </Card>

                    <Card title="NUE y padrón">
                        <div className="p-5 sm:p-6 space-y-5">
                            <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                El <strong className="text-zinc-800 dark:text-zinc-200">NUE</strong> enlaza tu cuenta con el padrón de personal para Mi vestuario y trámites.
                            </p>

                            <Field label="Número único de empleado (NUE)" error={errNue}>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                    <input
                                        type="text"
                                        value={nue}
                                        onChange={(e) => setNue(e.target.value)}
                                        placeholder="Ej. 00012345"
                                        maxLength={15}
                                        className={`${inputClass} flex-1 font-mono text-[15px] sm:text-sm tracking-tight`}
                                    />
                                    <button
                                        type="button"
                                        onClick={saveNue}
                                        disabled={savingNue}
                                        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:min-w-[7.5rem] touch-manipulation"
                                    >
                                        {savingNue ? 'Guardando…' : 'Actualizar NUE'}
                                    </button>
                                </div>
                            </Field>

                            {profile?.empleado && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/25 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            Unidad responsable
                                        </p>
                                        <p className="mt-1.5 text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                                            {profile.empleado.dependencia_nombre || profile.empleado.dependencia_clave || '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/25 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            Delegación
                                        </p>
                                        <p className="mt-1.5 text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
                                            {profile.empleado.delegacion_clave ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Link
                        to="/dashboard/mi-cuenta/cambiar-contrasena"
                        className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-5 py-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/30 touch-manipulation"
                    >
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cambiar contraseña</p>
                        <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            Actualiza la clave de acceso a tu cuenta
                        </p>
                    </Link>
                </div>
            )}

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 z-50 max-w-[min(100vw-2rem,20rem)] -translate-x-1/2 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-900/10 dark:border-emerald-800/60 dark:bg-emerald-950/90 dark:text-emerald-100 sm:left-auto sm:right-6 sm:translate-x-0"
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
