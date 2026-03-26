import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/ui/PasswordInput';

export default function LoginPage() {
    const navigate = useNavigate();
    const [rfc, setRfc] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState(window.LARAVEL_ERRORS || []);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        const formData = new FormData();
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.content || '');
        formData.append('rfc', rfc.toUpperCase());
        formData.append('password', password);
        formData.append('remember', remember ? '1' : '0');

        try {
            const res = await fetch('/login', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data?.success !== false) {
                window.location.href = data?.redirect || '/dashboard';
                return;
            }

            // 422: errores de validación (campos requeridos, etc.)
            if (res.status === 422 && data?.errors) {
                setErrors(Object.values(data.errors).flat());
            } else {
                // 200 con success:false = credenciales incorrectas; otro status = error genérico
                setErrors([data?.message || 'Credenciales incorrectas. Verifique su RFC y contraseña.']);
            }
        } catch {
            // Fallback: submit form tradicional (por si CSRF o redirección)
            const form = document.getElementById('login-form');
            if (form) {
                form.submit();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Inicio de Sesión" subtitle="Ingrese su RFC para acceder">
            {/* Overlay de carga en pantalla */}
            {loading && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 backdrop-blur-[2px] dark:bg-zinc-950/85">
                    <div className="flex flex-col items-center gap-3">
                        <span className="size-10 border-2 border-zinc-200 border-t-brand-gold dark:border-zinc-700 dark:border-t-brand-gold rounded-full animate-spin" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                            Iniciando sesión…
                        </p>
                    </div>
                </div>
            )}
            <header className="mb-8 text-center lg:text-left">
                <div className="mx-auto h-0.5 w-9 rounded-full bg-brand-gold lg:mx-0" aria-hidden />
                <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Inicio de sesión
                </h2>
                <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Ingrese su RFC para acceder
                </p>
            </header>

            {errors.length > 0 && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/60 dark:bg-red-950/30">
                    <p className="text-[13px] leading-snug text-red-700 dark:text-red-300">{errors[0]}</p>
                </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <div className="space-y-1.5">
                    <label className="ml-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                        RFC
                    </label>
                    <input
                        type="text"
                        name="rfc"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value)}
                        placeholder="ABCD123456XYZ"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm uppercase text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-gold/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
                        required
                        autoFocus
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="ml-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                        Contraseña
                    </label>
                    <PasswordInput
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div className="flex items-center px-0.5 text-[12px]">
                    <label className="group flex cursor-pointer items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="rounded border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                        />
                        <span>Recordarme en este equipo</span>
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-zinc-900 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                    Iniciar sesión
                </button>
            </form>

            <footer className="mt-10 space-y-1 border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    Secretaría de Administración Oaxaca
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                    Gobierno de Oaxaca
                </p>
            </footer>
        </AuthLayout>
    );
}
