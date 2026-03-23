import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

function Inp({ className = '', ...props }) {
    return (
        <input
            className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors ${className}`}
            {...props}
        />
    );
}

export default function MiCuentaPage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
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
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Mi Cuenta</h1>
                <p className="text-sm text-zinc-400 mt-0.5">Información personal y acceso.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Info del usuario */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-xs font-medium text-zinc-400 mb-3">Datos personales</p>
                        <form onSubmit={saveInfo} className="space-y-3">
                            {errInfo.general && (
                                <p className="text-sm text-red-500">{errInfo.general}</p>
                            )}
                            <Field label="Nombre" error={errInfo.name}>
                                <Inp value={formInfo.name} onChange={(e) => setFormInfo({ ...formInfo, name: e.target.value })} placeholder="Nombre completo" />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="RFC" error={errInfo.rfc}>
                                    <Inp value={formInfo.rfc} onChange={(e) => setFormInfo({ ...formInfo, rfc: e.target.value.toUpperCase() })} placeholder="RFC" maxLength={20} />
                                </Field>
                                <Field label="Correo" error={errInfo.email}>
                                    <Inp type="email" value={formInfo.email} onChange={(e) => setFormInfo({ ...formInfo, email: e.target.value })} placeholder="correo@ejemplo.com" />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                <Field label="NUE" error={errNue}>
                                    <div className="flex gap-2">
                                        <Inp value={nue} onChange={(e) => setNue(e.target.value)} placeholder="Ej. 00012345" maxLength={15} />
                                        <button type="button" onClick={saveNue} disabled={savingNue}
                                            className="shrink-0 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                            {savingNue ? '…' : 'Cambiar'}
                                        </button>
                                    </div>
                                </Field>
                                {profile?.empleado && (
                                    <>
                                        <Field label="Dependencia">
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 py-2">{profile.empleado.dependencia_nombre || profile.empleado.dependencia_clave || '—'}</p>
                                        </Field>
                                        <Field label="Delegación">
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 py-2">{profile.empleado.delegacion_clave ?? '—'}</p>
                                        </Field>
                                    </>
                                )}
                            </div>
                            <div className="pt-1">
                                <button type="submit" disabled={savingInfo}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                                    {savingInfo ? 'Guardando…' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Cambiar contraseña */}
                    <Link
                        to="/dashboard/mi-cuenta/cambiar-contrasena"
                        className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
                    >
                        <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Cambiar contraseña</p>
                            <p className="text-xs text-zinc-400 mt-0.5">Actualiza tu contraseña de acceso</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 shrink-0" />
                    </Link>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white text-sm font-medium shadow-lg"
                    onAnimationEnd={() => setToast(null)}>
                    {toast}
                </div>
            )}
        </div>
    );
}
