<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SIVSO | Sistema Integral de Vestuario</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body class="antialiased">
    <div id="root"></div>
    @php
        $appState = [
            'csrfToken' => csrf_token(),
            'authenticated' => auth()->check(),
            'user' => null,
            'mustChangePassword' => false,
            'logoutUrl' => null,
        ];
        if (auth()->check()) {
            $appState['user'] = [
                'name' => auth()->user()->name ?? 'Admin',
                'email' => auth()->user()->email ?? (auth()->user()->rfc ? auth()->user()->rfc . '@sivso.gob' : 'admin@sivso.gob'),
            ];
            $appState['mustChangePassword'] = false;
            $appState['logoutUrl'] = route('logout');
        }
    @endphp
    <script>
        window.sivsoApp = @json($appState);
    </script>
</body>
</html>
