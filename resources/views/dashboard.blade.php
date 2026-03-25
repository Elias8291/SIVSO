<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SIVSO | Panel de Control</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/dashboard.jsx'])
</head>
<body class="antialiased">
    <div id="dashboard-root"></div>
    <script>
        window.sivsoAuth = {!! json_encode([
            'logoutUrl' => route('logout'),
            'csrfToken' => csrf_token(),
            'user' => [
                'name' => auth()->user()->name ?? 'Admin Oaxaca',
                'email' => auth()->user()->email ?? (auth()->user()->rfc ? auth()->user()->rfc . '@sivso.gob' : 'admin@sivso.gob'),
            ]
        ]) !!};
    </script>
</body>
</html>
