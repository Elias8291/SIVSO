<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="theme-color" content="#AF9460"/>
    <title>@yield('title', 'Error') — SIVSO</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    @include('errors.partials.styles')
</head>
<body class="err-page @yield('body-class')">
    <div class="err-shell">
        <header class="err-header">
            <a href="{{ url('/') }}" class="err-brand">SIVSO</a>
        </header>

        <main class="err-main">
            <div class="err-card">
                @yield('content')
            </div>
        </main>

        <footer class="err-footer">
            <a href="{{ url('/') }}">Inicio</a>
            <span aria-hidden="true">·</span>
            <a href="{{ url('/login') }}">Iniciar sesión</a>
        </footer>
    </div>
</body>
</html>
