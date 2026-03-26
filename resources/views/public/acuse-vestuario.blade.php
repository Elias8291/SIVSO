<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#AF9460"/>
    <title>Acuse de vestuario — Folio {{ $folio }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    @include('public.partials.acuse-consulta-styles')
</head>
<body class="acus-consulta">
    <div class="acus-shell">
        <header class="acus-header">
            <div class="acus-brand">
                <span class="acus-brand-mark">SIVSO</span>
                <span class="acus-brand-sub">Consulta pública de acuse de vestuario</span>
            </div>
        </header>

        <main>
            @if ($verificacion_ok === true)
                <section class="acus-verif acus-verif--ok" aria-live="polite">
                    <p class="acus-verif-label">Verificación</p>
                    <p class="acus-verif-text">{{ $verificacion_mensaje }}</p>
                </section>
            @elseif ($verificacion_ok === false)
                <section class="acus-verif acus-verif--bad" aria-live="polite">
                    <p class="acus-verif-label">Verificación</p>
                    <p class="acus-verif-text">{{ $verificacion_mensaje }}</p>
                </section>
            @else
                <section class="acus-verif acus-verif--neutral" aria-live="polite">
                    <p class="acus-verif-label">Verificación</p>
                    <p class="acus-verif-text">{{ $verificacion_mensaje }}</p>
                </section>
            @endif

            <section class="acus-card" aria-label="Constancia de acuse">
                <div class="acuse-web-doc">
                    @include('pdf.partials.acuse-body')
                </div>
            </section>

            <footer class="acus-footer">
                <p>
                    Constancia de consulta pública. El enlace firmado caduca según la política del sistema;
                    vuelva a generar el PDF si necesita un código QR vigente.
                </p>
            </footer>
        </main>
    </div>
</body>
</html>
