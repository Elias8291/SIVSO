<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Simulate what VestuarioController does
$user = DB::table('users')->where('id', 10165)->first();
echo "User: {$user->name} (id={$user->id})\n";

$empleado = DB::table('empleados')->where('user_id', $user->id)->first();
echo "Empleado: " . ($empleado ? "{$empleado->nombre} {$empleado->apellido_paterno} (id={$empleado->id})" : "NULL") . "\n";

if ($empleado) {
    $anioSolicitado = 2026;
    $tieneAnio = DB::table('asignaciones_vestuario')
        ->where('empleado_id', $empleado->id)
        ->where('anio', $anioSolicitado)
        ->exists();
    echo "Tiene asignaciones 2026: " . ($tieneAnio ? 'SÍ' : 'NO') . "\n";

    $anio = DB::table('asignaciones_vestuario')
        ->where('empleado_id', $empleado->id)
        ->max('anio');
    echo "Año más reciente con datos: {$anio}\n";

    $count = DB::table('asignaciones_vestuario')
        ->where('empleado_id', $empleado->id)
        ->count();
    echo "Total asignaciones: {$count}\n";
}

// Check routes
echo "\n--- API Routes for vestuario ---\n";
foreach (app('router')->getRoutes() as $route) {
    if (str_contains($route->uri(), 'vestuario')) {
        echo $route->methods()[0] . ' ' . $route->uri() . "\n";
    }
}
