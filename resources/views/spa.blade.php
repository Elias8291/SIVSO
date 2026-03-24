<!DOCTYPE html>
<html lang="es">
<head>
    <script>(function(){try{document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme: dark)').matches);}catch(e){}})();</script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5, user-scalable=yes">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SIVSO | Sistema Integral de Vestuario</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body class="antialiased min-h-screen bg-[#F7F7F8] dark:bg-[#060607]">
    <div id="root"></div>
    @php
        $appState = [
            /** Base absoluta de /api (evita 404 si la app corre en subcarpeta, ej. /public). */
            'apiBase' => rtrim(url('/api'), '/'),
            'csrfToken' => csrf_token(),
            'authenticated' => auth()->check(),
            'user' => null,
            'mustChangePassword' => false,
            'logoutUrl' => null,
        ];
        if (auth()->check()) {
            $user = auth()->user();
            $appState['user'] = [
                'name' => $user->name ?? 'Admin',
                'email' => $user->email ?? ($user->rfc ? $user->rfc . '@sivso.gob' : 'admin@sivso.gob'),
            ];
            $appState['permissions'] = $user->getAllPermissions()->pluck('name')->values()->all();
            $appState['roles'] = $user->getRoleNames()->values()->all();
            $appState['mustChangePassword'] = false;
            $appState['logoutUrl'] = route('logout');
        }
    @endphp
    <script>
        window.sivsoApp = @json($appState);
    </script>
</body>
</html>
