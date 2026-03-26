import React from 'react';
import { createPortal } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Layout compartido para Login y Cambiar Contraseña
 * Diseño split: imagen izquierda + formulario derecha
 *
 * El toggle de tema se renderiza con portal en document.body: dentro de padres con
 * overflow:hidden, position:fixed falla en Safari/iOS (vertical) y el botón no recibe toques.
 */
export default function AuthLayout({ children, subtitle = 'Ingrese su RFC para acceder', title = 'Inicio de Sesión' }) {
    const { isDarkMode, toggleTheme } = useTheme();

    const themeButton = (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
            }}
            className="fixed z-[100] p-3 min-h-[44px] min-w-[44px] rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors touch-manipulation pointer-events-auto"
            style={{
                top: 'max(1rem, env(safe-area-inset-top, 0px))',
                right: 'max(1rem, env(safe-area-inset-right, 0px))',
            }}
            aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
            {isDarkMode ? <Sun className="w-5 h-5 text-zinc-400" aria-hidden /> : <Moon className="w-5 h-5 text-zinc-500" aria-hidden />}
        </button>
    );

    return (
        <div className="h-screen min-h-[100dvh] flex items-center justify-center p-0 lg:p-8 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto overscroll-none">
            {/* SIVSO decorativo en el fondo exterior (detrás de la tarjeta) */}
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                <span className="text-[7.5rem] sm:text-[16rem] lg:text-[20rem] font-black tracking-[0.2em] text-brand-gold/10 dark:text-brand-gold/15 leading-none italic">SIVSO</span>
            </span>
            <main className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden border-0 bg-white dark:bg-[#0A0A0B] shadow-sm lg:h-[600px] lg:flex-row lg:rounded-xl lg:border lg:border-zinc-200 lg:dark:border-zinc-800">
                {/* Panel izquierdo con imagen */}
                <section className="relative h-[180px] w-full overflow-hidden bg-zinc-100 dark:bg-[#0A0A0B] lg:h-full lg:w-5/12">
                    <img
                        src="/images/oficialLogin.png"
                        alt="SIVSO"
                        className="absolute inset-0 w-full h-full object-cover brightness-90 contrast-105 dark:brightness-80 dark:contrast-110"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/sivso-placeholder.svg';
                        }}
                    />
                    <div className="absolute inset-0 bg-black/35 lg:bg-gradient-to-t lg:from-black/85 lg:via-black/25 lg:to-transparent" />
                    <div className="absolute inset-0 z-30 flex items-center justify-center lg:hidden">
                        <h1 className="text-4xl font-semibold tracking-[0.22em] text-white drop-shadow-md">SIVSO</h1>
                    </div>
                    <div className="absolute bottom-[-1px] left-0 w-full lg:hidden z-20 pointer-events-none">
                        <svg viewBox="0 0 1440 120" className="w-full h-auto block scale-[1.02] origin-bottom">
                            <path
                                d="M0 120H1440V58.5C1185.5 18.5 868.5 0 720 0C571.5 0 254.5 18.5 0 58.5V120Z"
                                className="fill-white dark:fill-[#0A0A0B] transition-colors"
                            />
                        </svg>
                    </div>
                    <div className="relative z-10 hidden h-full w-full flex-col justify-end p-10 lg:flex">
                        <h1 className="mb-5 text-5xl font-bold tracking-[0.18em] text-white">SIVSO</h1>
                        <div className="mb-4 h-0.5 w-9 rounded-full bg-brand-gold" aria-hidden />
                        <h2 className="text-lg font-light leading-snug text-white/95">
                            Sistema integral de vestuario
                        </h2>
                        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-400">
                            Sindicato de Trabajadores de Oaxaca
                        </p>
                    </div>
                </section>

                {/* Panel derecho: toggle de tema va por portal (ver arriba) */}
                <section className="relative z-10 flex w-full flex-col justify-center bg-white px-6 py-10 dark:bg-[#0A0A0B] md:px-12 lg:w-7/12 lg:px-16 lg:py-0">
                    <div className="mx-auto w-full max-w-sm">{children}</div>
                </section>
            </main>
            {typeof document !== 'undefined' ? createPortal(themeButton, document.body) : null}
        </div>
    );
}
