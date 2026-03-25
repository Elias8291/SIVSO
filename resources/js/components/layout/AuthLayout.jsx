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
            className="fixed z-[100] p-3 min-h-[44px] min-w-[44px] rounded-full border border-zinc-200 dark:border-[#1f1f1f] bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-md shadow-lg hover:bg-zinc-50 dark:hover:bg-[#050505] transition-colors touch-manipulation pointer-events-auto"
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
        <div className="h-screen min-h-[100dvh] flex items-center justify-center bg-zinc-100 dark:bg-[#050505] p-0 lg:p-8 transition-colors duration-300 relative overflow-x-hidden overflow-y-auto overscroll-none">
            {/* SIVSO decorativo en el fondo exterior (detrás de la tarjeta) */}
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                <span className="text-[20rem] lg:text-[28rem] font-black tracking-[0.15em] text-brand-gold/10 dark:text-brand-gold/15 leading-none italic">SIVSO</span>
            </span>
            <main className="w-full max-w-5xl lg:h-[600px] flex flex-col lg:flex-row overflow-hidden lg:rounded-2xl bg-white dark:bg-[#0f0f0f] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-none lg:border border-zinc-200 dark:border-[#1f1f1f] relative z-10">
                {/* Panel izquierdo con imagen */}
                <section className="w-full lg:w-5/12 relative overflow-hidden h-[180px] lg:h-full bg-white dark:bg-[#0f0f0f]">
                    <img
                        src="/images/oficialLogin.png"
                        alt="SIVSO"
                        className="absolute inset-0 w-full h-full object-cover brightness-90 contrast-105 dark:brightness-80 dark:contrast-110"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/sivso-placeholder.svg';
                        }}
                    />
                    <div className="absolute inset-0 bg-black/40 lg:bg-gradient-to-t lg:from-black/90 lg:via-black/30 lg:to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center lg:hidden z-30">
                        <h1 className="text-5xl font-extrabold tracking-[0.3em] text-white drop-shadow-2xl">SIVSO</h1>
                    </div>
                    <div className="absolute bottom-[-1px] left-0 w-full lg:hidden z-20 pointer-events-none">
                        <svg viewBox="0 0 1440 120" className="w-full h-auto block scale-[1.02] origin-bottom">
                            <path
                                d="M0 120H1440V58.5C1185.5 18.5 868.5 0 720 0C571.5 0 254.5 18.5 0 58.5V120Z"
                                className="fill-white dark:fill-[#0f0f0f] transition-colors"
                            />
                        </svg>
                    </div>
                    <div className="hidden lg:flex relative z-10 flex-col justify-end p-10 h-full w-full">
                        <h1 className="text-6xl font-extrabold tracking-[0.2em] text-white mb-6">SIVSO</h1>
                        <div className="h-[2px] w-10 bg-brand-gold mb-4" />
                        <h2 className="text-xl font-light leading-snug text-white drop-shadow-md">
                            SISTEMA INTEGRAL VESTUARIO SINDICATO OAXACA
                        </h2>
                        <p className="mt-2 text-[12px] text-zinc-400 uppercase tracking-[0.4em]">
                            Sindicato de Trabajadores de Oaxaca
                        </p>
                    </div>
                </section>

                {/* Panel derecho: toggle de tema va por portal (ver arriba) */}
                <section className="w-full lg:w-7/12 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-10 lg:py-0 relative bg-white dark:bg-[#0f0f0f] z-10">
                    <div className="w-full max-w-sm mx-auto">{children}</div>
                </section>
            </main>
            {typeof document !== 'undefined' ? createPortal(themeButton, document.body) : null}
        </div>
    );
}
