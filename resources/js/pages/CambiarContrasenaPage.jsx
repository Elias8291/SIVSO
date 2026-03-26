import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/ui/PasswordInput';

export default function CambiarContrasenaPage() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState(window.LARAVEL_ERRORS || []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);

        const formData = new FormData();
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.content || '');
        formData.append('password', password);
        formData.append('password_confirmation', passwordConfirmation);

        try {
            const res = await fetch('/cambiar-contrasena', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                window.location.href = data.redirect || '/dashboard';
                return;
            }

            if (res.status === 422 && data.errors) {
                setErrors(Object.values(data.errors).flat());
            } else {
                setErrors([data.message || 'Error al actualizar contraseña']);
            }
        } catch {
            const form = document.getElementById('cambiar-contrasena-form');
            if (form) form.submit();
        }
    };

    return (
        <AuthLayout
            title="Nueva Contraseña"
            subtitle="Actualice sus credenciales para continuar"
        >
            <header className="mb-8 text-center lg:text-left">
                <div className="mx-auto h-0.5 w-9 rounded-full bg-brand-gold lg:mx-0" aria-hidden />
                <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Nueva contraseña
                </h2>
                <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                    Actualice sus credenciales para continuar
                </p>
            </header>

            {errors.length > 0 && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/60 dark:bg-red-950/30">
                    <p className="text-[13px] leading-snug text-red-700 dark:text-red-300">{errors[0]}</p>
                </div>
            )}

            <form id="cambiar-contrasena-form" onSubmit={handleSubmit} className="space-y-5">
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <div className="space-y-1.5">
                    <label className="ml-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                        Nueva contraseña <span className="text-brand-gold">*</span>
                    </label>
                    <PasswordInput
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Defina su clave"
                        required
                        minLength={8}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="ml-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                        Confirmar contraseña <span className="text-brand-gold">*</span>
                    </label>
                    <PasswordInput
                        name="password_confirmation"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="Repita su clave"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="mt-1 w-full rounded-xl bg-zinc-900 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900"
                >
                    Guardar y acceder
                </button>
                <Link
                    to="/login"
                    className="block w-full py-2 text-center text-[11px] font-medium text-zinc-500 transition-colors hover:text-brand-gold dark:text-zinc-400"
                >
                    Regresar al inicio
                </Link>
            </form>

            <footer className="mt-10 border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    Sistema integral de vestuario — Sindicato de Oaxaca
                </p>
            </footer>
        </AuthLayout>
    );
}
