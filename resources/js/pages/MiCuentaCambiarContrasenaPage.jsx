import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { api } from '../lib/api';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[13px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function PwdInp({ value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3.5 py-3 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-base sm:text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/20 focus:border-[#AF9460]/40 transition-all touch-manipulation"
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
                {show ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
        </div>
    );
}

function Toast({ message, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl text-[12px] font-semibold">
            <CheckCircle size={15} strokeWidth={2} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            {message}
        </div>
    );
}

export default function MiCuentaCambiarContrasenaPage() {
    const [formPwd, setFormPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [errPwd, setErrPwd] = useState({});
    const [savingPwd, setSavingPwd] = useState(false);
    const [toast, setToast] = useState(null);

    const savePwd = async (e) => {
        e.preventDefault();
        setSavingPwd(true);
        setErrPwd({});
        try {
            await api.put('/api/perfil/password', formPwd);
            setFormPwd({ current_password: '', password: '', password_confirmation: '' });
            setToast('Contraseña actualizada correctamente.');
        } catch (err) {
            setErrPwd(err.errors ?? { general: err.message });
        } finally {
            setSavingPwd(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-xl px-0">
            <Link
                to="/dashboard/mi-cuenta"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#AF9460] dark:hover:text-[#AF9460] mb-4 transition-colors"
            >
                <ArrowLeft size={14} strokeWidth={2} />
                Volver a Mi Cuenta
            </Link>

            <PageHeader
                title="Cambiar contraseña"
                description="Actualiza tu contraseña de acceso. Usa una contraseña segura de al menos 8 caracteres."
            />

            <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b border-zinc-50 dark:border-zinc-800/60 flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                        <KeyRound size={15} className="text-[#AF9460]" strokeWidth={1.8} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Nueva contraseña</p>
                        <p className="text-[14px] text-zinc-400 mt-0.5">Ingresa tu contraseña actual y la nueva</p>
                    </div>
                </div>
                <div className="px-4 sm:px-6 py-5">
                    <form onSubmit={savePwd} className="space-y-4">
                        {errPwd.general && (
                            <p className="text-[14px] text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">
                                {errPwd.general}
                            </p>
                        )}
                        <Field label="Contraseña actual" error={errPwd.current_password?.[0]}>
                            <PwdInp
                                value={formPwd.current_password}
                                onChange={(e) => setFormPwd({ ...formPwd, current_password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </Field>
                        <Field label="Nueva contraseña" error={errPwd.password?.[0]}>
                            <PwdInp
                                value={formPwd.password}
                                onChange={(e) => setFormPwd({ ...formPwd, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </Field>
                        <Field label="Confirmar contraseña" error={errPwd.password_confirmation?.[0]}>
                            <PwdInp
                                value={formPwd.password_confirmation}
                                onChange={(e) => setFormPwd({ ...formPwd, password_confirmation: e.target.value })}
                                placeholder="••••••••"
                            />
                        </Field>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                            <Link
                                to="/dashboard/mi-cuenta"
                                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[14px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all touch-manipulation"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={savingPwd}
                                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all touch-manipulation"
                            >
                                {savingPwd ? 'Cambiando…' : 'Cambiar contraseña'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
