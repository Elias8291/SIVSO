<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\DependenciaController;
use App\Http\Controllers\Api\DelegacionController;
use App\Http\Controllers\Api\DelegadoController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\EmpleadoController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\VestuarioController;
use App\Http\Controllers\Api\PresupuestoController;
use App\Http\Controllers\Api\ProgramasController;
use App\Http\Controllers\Api\MiDelegacionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/cambiar-contrasena', [AuthController::class, 'showCambiarContrasena'])->name('cambiar-contrasena');
    Route::post('/cambiar-contrasena', [AuthController::class, 'cambiarContrasena']);
});

Route::middleware('auth')->prefix('api')->group(function () {
    // Perfil del usuario autenticado
    Route::get('perfil',              [ProfileController::class, 'show']);
    Route::put('perfil',              [ProfileController::class, 'update']);
    Route::put('perfil/password',     [ProfileController::class, 'updatePassword']);
    Route::put('perfil/nue',          [ProfileController::class, 'updateNue']);
    Route::put('perfil/delegado',     [ProfileController::class, 'updateDelegado']);

    // Empleados (tabla: empleados)
    Route::get('empleados',                          [EmpleadoController::class, 'index']);
    Route::post('empleados',                         [EmpleadoController::class, 'store']);
    Route::get('empleados/{empleado}/vestuario',     [VestuarioController::class, 'empleadoVestuario']);
    Route::put('empleados/{empleado}/vestuario/{id}/talla',    [VestuarioController::class, 'empleadoUpdateTalla']);
    Route::put('empleados/{empleado}/vestuario/{id}/producto', [VestuarioController::class, 'empleadoUpdateProducto']);
    Route::get('empleados/{empleado}',               [EmpleadoController::class, 'show']);
    Route::put('empleados/{empleado}',               [EmpleadoController::class, 'update']);
    Route::delete('empleados/{empleado}',            [EmpleadoController::class, 'destroy']);
    Route::patch('empleados/{empleado}/toggle',      [EmpleadoController::class, 'toggle']);

    // Productos (tabla: productos + producto_precios)
    Route::get('productos',                      [ProductoController::class, 'index']);
    Route::post('productos',                     [ProductoController::class, 'store']);
    Route::get('productos/{id}',                 [ProductoController::class, 'show']);
    Route::put('productos/{id}',                 [ProductoController::class, 'update']);
    Route::delete('productos/{id}',              [ProductoController::class, 'destroy']);
    Route::patch('productos/{id}/toggle',        [ProductoController::class, 'toggle']);

    // Mi vestuario (empleado autenticado — tabla: selecciones)
    Route::get ('mi-vestuario',                        [VestuarioController::class, 'index']);
    Route::put ('mi-vestuario/{id}/talla',             [VestuarioController::class, 'updateTalla']);
    Route::put ('mi-vestuario/{id}/producto',          [VestuarioController::class, 'updateProducto']);

    // Mi delegación (delegaciones del usuario autenticado)
    Route::get('mi-delegacion',                         [MiDelegacionController::class, 'index']);

    Route::apiResource('usuarios', UserController::class);
    Route::patch('usuarios/{user}/toggle-activo', [UserController::class, 'toggleActivo']);

    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permisos', PermissionController::class);

    // Organización
    // Panel 1: Dependencias (tabla: dependencias)
    Route::get('dependencias',                    [DependenciaController::class, 'index']);
    Route::post('dependencias',                   [DependenciaController::class, 'store']);
    Route::put('dependencias/{dependencia}',      [DependenciaController::class, 'update']);
    Route::delete('dependencias/{dependencia}',   [DependenciaController::class, 'destroy']);

    // Panel 2: Delegados (tabla: delegados + delegado_delegacion)
    Route::get('delegados/resumen',               [DelegadoController::class, 'resumen']);
    Route::get('delegados',                       [DelegadoController::class, 'index']);
    Route::post('delegados',                      [DelegadoController::class, 'store']);
    Route::put('delegados/{id}',                  [DelegadoController::class, 'update']);
    Route::delete('delegados/{id}',               [DelegadoController::class, 'destroy']);

    // Panel 3: Trabajadores de un delegado (tabla: empleados por delegacion_id)
    Route::get('trabajadores',                    [DelegacionController::class, 'index']);

    // Panel 4: Programas/selecciones del trabajador (tabla: selecciones)
    Route::get('programas',                       [ProgramasController::class, 'index']);

    // Catálogo de delegaciones por dependencia (para filtros)
    Route::get('delegaciones',                    [DelegacionController::class, 'codigos']);

    // Partidas presupuestales: gasto por UR × partida
    Route::get('partidas',                        [PresupuestoController::class, 'index']);
    Route::put('partidas/limite',                 [PresupuestoController::class, 'setLimite']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => view('spa'))->name('dashboard');
    Route::get('/dashboard/{path}', fn () => view('spa'))->where('path', '.*')->name('dashboard.catch');
});
