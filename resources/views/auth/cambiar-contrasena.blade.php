<!DOCTYPE html>
<html lang="es">
<head>
    <script>(function(){try{document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme: dark)').matches);}catch(e){}})();</script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIVSO | Nueva Contraseña</title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        brand: {
                            gold: "#AF9460",
                            black: "#050505",
                            dark: "#0f0f0f",
                            border: "#1f1f1f"
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .transition-theme { transition: all 0.4s ease; }
        .img-clear { filter: brightness(0.8) contrast(1.1); }

        /* Evita zoom en móvil al enfocar campos (iOS requiere min 16px) */
        input, select, textarea {
            font-size: 16px !important;
        }

        .dark input {
            color: #ffffff !important;
            background-color: #050505 !important;
        }
        input {
            color: #18181b !important;
        }

        @media (max-width: 1023px) {
            .mobile-curve-container { height: 180px; }
            /* Bloquear rebote/overscroll en móvil: layout fijo, sin espacio gris abajo */
            html, body {
                overflow: hidden;
                overscroll-behavior: none;
                height: 100%;
                position: fixed;
                inset: 0;
                -webkit-overflow-scrolling: touch;
            }
        }
    </style>
</head>

<body class="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-brand-black p-0 lg:p-8 transition-theme">

    <main class="w-full max-w-5xl lg:h-[600px] flex flex-col lg:flex-row overflow-hidden lg:rounded-2xl bg-white dark:bg-brand-dark shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-none lg:border border-zinc-200 dark:border-brand-border">

        <section class="w-full lg:w-5/12 relative overflow-hidden mobile-curve-container lg:h-full bg-white dark:bg-brand-dark">
            <img src="{{ asset('images/oficialLogin.jpg') }}" class="absolute inset-0 w-full h-full object-cover img-clear" alt="SIVSO Seguridad" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-black/40 lg:bg-gradient-to-t lg:from-black/90 lg:via-black/30 lg:to-transparent"></div>

            <div class="absolute inset-0 flex items-center justify-center lg:hidden z-30">
                <h1 class="text-5xl font-extrabold tracking-[0.3em] text-white drop-shadow-2xl">SIVSO</h1>
            </div>

            <div class="absolute bottom-[-1px] left-0 w-full lg:hidden z-20 pointer-events-none">
                <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block scale-[1.02] origin-bottom">
                    <path d="M0 120H1440V58.5C1185.5 18.5 868.5 0 720 0C571.5 0 254.5 18.5 0 58.5V120Z" class="fill-white dark:fill-brand-dark transition-theme" />
                </svg>
            </div>

            <div class="hidden lg:flex relative z-10 flex-col justify-end p-10 h-full w-full">
                <h1 class="text-6xl font-extrabold tracking-[0.2em] text-white mb-6">SIVSO</h1>
                <div class="h-[2px] w-10 bg-brand-gold mb-4"></div>
                <h2 class="text-xl font-light leading-snug text-white drop-shadow-md">
                    Personalización de <br>
                    <span class="font-bold text-brand-gold italic">Acceso Institucional.</span>
                </h2>
                <p class="mt-2 text-[9px] text-zinc-400 uppercase tracking-[0.4em]">Sindicato de Trabajadores de Oaxaca</p>
            </div>
        </section>

        <section class="w-full lg:w-7/12 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-10 lg:py-0 relative bg-white dark:bg-brand-dark z-10">

            <div class="w-full max-w-sm mx-auto">
                <header class="mb-10 text-center lg:text-left">
                    <div class="space-y-1">
                        <h2 class="text-2xl lg:text-3xl font-bold tracking-tight text-black dark:text-white">Nueva Contraseña</h2>
                        <p class="text-[10px] lg:text-[11px] text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-widest">Actualice sus credenciales para continuar</p>
                    </div>
                </header>

                @if ($errors->any())
                    <div class="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p class="text-sm text-red-600 dark:text-red-400">{{ $errors->first() }}</p>
                    </div>
                @endif

                <form method="POST" action="{{ route('cambiar-contrasena') }}" class="space-y-6">
                    @csrf
                    <div class="space-y-1.5">
                        <label class="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
                            Nueva Contraseña <span class="text-brand-gold">*</span>
                        </label>
                        <input type="password" name="password" placeholder="Defina su clave"
                            class="w-full px-4 py-3 bg-zinc-50 dark:bg-brand-black border border-zinc-200 dark:border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 text-sm shadow-sm" required>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold ml-1">
                            Confirmar Contraseña <span class="text-brand-gold">*</span>
                        </label>
                        <input type="password" name="password_confirmation" placeholder="Repita su clave"
                            class="w-full px-4 py-3 bg-zinc-50 dark:bg-brand-black border border-zinc-200 dark:border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 text-sm shadow-sm" required>
                    </div>

                    <button type="submit" class="w-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[11px] font-bold py-4 rounded-lg hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg mt-2">
                        Guardar y Acceder
                    </button>

                    <a href="{{ route('login') }}" class="block w-full text-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[10px] font-medium uppercase tracking-widest transition-colors py-2">
                        Regresar al inicio
                    </a>
                </form>

                <footer class="mt-12 pt-6 border-t border-zinc-50 dark:border-zinc-900 text-center">
                    <p class="text-[10px] text-zinc-400 dark:text-zinc-600 font-semibold uppercase tracking-[0.1em]">
                        Sistema Integral de Vestuario Sindicato de Oaxaca
                    </p>
                </footer>
            </div>
        </section>

        <button id="theme-toggle" class="fixed top-4 right-4 lg:absolute lg:top-6 lg:right-6 lg:bottom-auto p-3 rounded-full border border-zinc-200 dark:border-brand-border bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md shadow-lg lg:shadow-none hover:bg-zinc-50 dark:hover:bg-brand-black transition-theme z-[100]">
            <svg id="sun-icon" class="hidden dark:block w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" stroke-width="2" stroke-linecap="round"/></svg>
            <svg id="moon-icon" class="block dark:hidden w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
    </main>

    <script>
        const toggle = document.getElementById("theme-toggle");
        toggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");
        });
    </script>
</body>
</html>
