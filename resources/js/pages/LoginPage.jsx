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
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <span className="size-12 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">
                            Iniciando sesión...
                        </p>
                    </div>
                </div>
            )}
            <header className="mb-10 text-center lg:text-left">
                <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-black dark:text-white">
                        Inicio de Sesión
                    </h2>
                    <p className="text-[10px] lg:text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
                        Ingrese su RFC para acceder
                    </p>
                </div>
            </header>

            {errors.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{errors[0]}</p>
                </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
                        RFC
                    </label>
                    <input
                        type="text"
                        name="rfc"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value)}
                        placeholder="ABCD123456XYZ"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-white text-sm shadow-sm uppercase"
                        required
                        autoFocus
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
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
                <div className="flex items-center text-[11px] px-1">
                    <label className="flex items-center space-x-2 cursor-pointer group text-zinc-400">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="rounded border-zinc-200 dark:border-zinc-800 bg-transparent"
                        />
                        <span>Recordarme en este equipo</span>
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[11px] font-bold py-4 rounded-lg hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    Iniciar sesión
                </button>
            </form>

            <footer className="mt-12 pt-6 border-t border-zinc-50 dark:border-zinc-900 space-y-1 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-[0.1em]">
                    Secretaría de Administración Oaxaca
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-[0.15em]">
                    Gobierno de Oaxaca
                </p>
            </footer>
        </AuthLayout>
    );
}
