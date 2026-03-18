import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Layout compartido para Login y Cambiar Contraseña
 * Diseño split: imagen izquierda + formulario derecha
 */
export default function AuthLayout({ children, subtitle = 'Ingrese su RFC para acceder', title = 'Inicio de Sesión' }) {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className="h-screen min-h-[100dvh] flex items-center justify-center bg-zinc-100 dark:bg-[#050505] p-0 lg:p-8 transition-colors duration-300 relative overflow-hidden overscroll-none touch-pan-y">
            {/* SIVSO decorativo en el fondo exterior (detrás de la tarjeta) */}
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                <span className="text-[20rem] lg:text-[28rem] font-black tracking-[0.15em] text-[#AF9460]/10 dark:text-[#AF9460]/15 leading-none italic">SIVSO</span>
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
                        <div className="h-[2px] w-10 bg-[#AF9460] mb-4" />
                        <h2 className="text-xl font-light leading-snug text-white drop-shadow-md">
                            SISTEMA INTEGRAL VESTUARIO SINDICATO OAXACA
                        </h2>
                        <p className="mt-2 text-[12px] text-zinc-400 uppercase tracking-[0.4em]">
                            Sindicato de Trabajadores de Oaxaca
                        </p>
                    </div>
                </section>

                {/* Panel derecho con contenido */}
                <section className="w-full lg:w-7/12 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-10 lg:py-0 relative bg-white dark:bg-[#0f0f0f] z-10">
                    <div className="w-full max-w-sm mx-auto">{children}</div>
                </section>

                {/* Toggle tema */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="fixed top-4 right-4 lg:absolute lg:top-6 lg:right-6 lg:bottom-auto p-3 rounded-full border border-zinc-200 dark:border-[#1f1f1f] bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-md shadow-lg hover:bg-zinc-50 dark:hover:bg-[#050505] transition-colors z-[100]"
                >
                    {isDarkMode ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-500" />}
                </button>
            </main>
        </div>
    );
}
