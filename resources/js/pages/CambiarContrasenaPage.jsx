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
            <header className="mb-10 text-center lg:text-left">
                <div className="space-y-1">
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-black dark:text-white">
                        Nueva Contraseña
                    </h2>
                    <p className="text-[10px] lg:text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
                        Actualice sus credenciales para continuar
                    </p>
                </div>
            </header>

            {errors.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{errors[0]}</p>
                </div>
            )}

            <form id="cambiar-contrasena-form" onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
                        Nueva Contraseña <span className="text-brand-gold">*</span>
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
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
                        Confirmar Contraseña <span className="text-brand-gold">*</span>
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
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[11px] font-bold py-4 rounded-lg hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg mt-2"
                >
                    Guardar y Acceder
                </button>
                <Link
                    to="/login"
                    className="block w-full text-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[10px] font-medium uppercase tracking-widest transition-colors py-2"
                >
                    Regresar al inicio
                </Link>
            </form>

            <footer className="mt-12 pt-6 border-t border-zinc-50 dark:border-zinc-900 text-center">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-semibold uppercase tracking-[0.1em]">
                    Sistema Integral de Vestuario Sindicato de Oaxaca
                </p>
            </footer>
        </AuthLayout>
    );
}
