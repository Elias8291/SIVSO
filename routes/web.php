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
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PeriodoController;
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
    // Perfil del usuario autenticado (sin permiso Spatie adicional)
    Route::get('perfil', [ProfileController::class, 'show']);
    Route::put('perfil', [ProfileController::class, 'update']);
    Route::put('perfil/password', [ProfileController::class, 'updatePassword']);
    Route::put('perfil/nue', [ProfileController::class, 'updateNue']);
    Route::put('perfil/delegado', [ProfileController::class, 'updateDelegado']);

    // Mi vestuario (empleado)
    Route::middleware('permission:ver_selecciones')->group(function () {
        Route::get('mi-vestuario', [VestuarioController::class, 'index']);
    });
    Route::middleware('permission:editar_seleccion')->group(function () {
        Route::put('mi-vestuario/{id}/talla', [VestuarioController::class, 'updateTalla']);
        Route::put('mi-vestuario/{id}/producto', [VestuarioController::class, 'updateProducto']);
    });

    // Mi delegación
    Route::middleware('permission:ver_mi_delegacion')->get('mi-delegacion', [MiDelegacionController::class, 'index']);

    // Empleados
    Route::middleware('permission:ver_empleados')->group(function () {
        Route::get('empleados', [EmpleadoController::class, 'index']);
        Route::get('empleados/{empleado}', [EmpleadoController::class, 'show']);
        Route::get('empleados/{empleado}/vestuario', [VestuarioController::class, 'empleadoVestuario']);
    });
    Route::middleware('permission:editar_empleados')->group(function () {
        Route::post('empleados', [EmpleadoController::class, 'store']);
        Route::post('empleados/{empleado}/crear-usuario', [EmpleadoController::class, 'crearUsuario']);
        Route::put('empleados/{empleado}', [EmpleadoController::class, 'update']);
        Route::delete('empleados/{empleado}', [EmpleadoController::class, 'destroy']);
        Route::patch('empleados/{empleado}/toggle', [EmpleadoController::class, 'toggle']);
    });
    Route::middleware('permission:editar_seleccion')->group(function () {
        Route::put('empleados/{empleado}/vestuario/{id}/talla', [VestuarioController::class, 'empleadoUpdateTalla']);
        Route::put('empleados/{empleado}/vestuario/{id}/producto', [VestuarioController::class, 'empleadoUpdateProducto']);
    });

    // Productos (catálogo o consulta desde Mi vestuario — sin menú de productos)
    Route::middleware('permission:ver_catalogo|ver_selecciones|editar_seleccion')->group(function () {
        Route::get('productos', [ProductoController::class, 'index']);
        Route::get('productos/{id}', [ProductoController::class, 'show']);
    });
    Route::middleware('permission:editar_catalogo')->group(function () {
        Route::post('productos', [ProductoController::class, 'store']);
        Route::put('productos/{id}', [ProductoController::class, 'update']);
        Route::delete('productos/{id}', [ProductoController::class, 'destroy']);
        Route::patch('productos/{id}/toggle', [ProductoController::class, 'toggle']);
    });

    // Administración de usuarios / roles / permisos
    Route::middleware('permission:gestionar_usuarios')->group(function () {
        Route::apiResource('usuarios', UserController::class);
        Route::patch('usuarios/{user}/toggle-activo', [UserController::class, 'toggleActivo']);
    });
    Route::middleware('permission:gestionar_roles')->group(function () {
        Route::apiResource('roles', RoleController::class);
    });
    Route::middleware('permission:gestionar_roles|gestionar_permisos')->group(function () {
        Route::get('permisos', [PermissionController::class, 'index']);
        Route::get('permisos/{permission}', [PermissionController::class, 'show']);
    });
    Route::middleware('permission:gestionar_permisos')->group(function () {
        Route::post('permisos', [PermissionController::class, 'store']);
        Route::put('permisos/{permission}', [PermissionController::class, 'update']);
        Route::delete('permisos/{permission}', [PermissionController::class, 'destroy']);
    });

    // Dependencias (lectura también para filtros de empleados)
    Route::middleware('permission:ver_dependencias|ver_empleados|editar_empleados')->group(function () {
        Route::get('dependencias', [DependenciaController::class, 'index']);
    });
    Route::middleware('permission:editar_dependencias')->group(function () {
        Route::post('dependencias', [DependenciaController::class, 'store']);
        Route::put('dependencias/{dependencia}', [DependenciaController::class, 'update']);
        Route::delete('dependencias/{dependencia}', [DependenciaController::class, 'destroy']);
    });

    // Delegados
    Route::middleware('permission:ver_delegados')->group(function () {
        Route::get('delegados/resumen', [DelegadoController::class, 'resumen']);
        Route::get('delegados', [DelegadoController::class, 'index']);
    });
    Route::middleware('permission:editar_delegados')->group(function () {
        Route::post('delegados', [DelegadoController::class, 'store']);
        Route::put('delegados/{id}', [DelegadoController::class, 'update']);
        Route::delete('delegados/{id}', [DelegadoController::class, 'destroy']);
    });

    // Delegaciones (códigos por UR: filtros empleados; listado completo: módulo delegaciones)
    Route::middleware('permission:ver_delegaciones|ver_empleados|editar_empleados')->group(function () {
        Route::get('delegaciones', [DelegacionController::class, 'codigos']);
    });
    Route::middleware('permission:ver_delegaciones')->group(function () {
        Route::get('delegaciones/all', [DelegacionController::class, 'index']);
    });
    Route::middleware('permission:editar_delegaciones')->group(function () {
        Route::post('delegaciones', [DelegacionController::class, 'store']);
        Route::put('delegaciones/{id}', [DelegacionController::class, 'update']);
        Route::delete('delegaciones/{id}', [DelegacionController::class, 'destroy']);
    });

    // Vista Organización (legacy): lectura amplia o permiso dedicado
    Route::middleware('permission:ver_organizacion|ver_empleados|ver_dependencias|ver_delegaciones|ver_delegados')->group(function () {
        Route::get('trabajadores', [DelegacionController::class, 'index']);
        Route::get('programas', [ProgramasController::class, 'index']);
    });

    // Partidas presupuestales
    Route::middleware('permission:ver_partidas')->group(function () {
        Route::get('partidas', [PresupuestoController::class, 'index']);
    });
    Route::middleware('permission:editar_partidas')->put('partidas/limite', [PresupuestoController::class, 'setLimite']);

    // Periodos
    Route::middleware('permission:gestionar_periodos')->group(function () {
        Route::get('periodos', [PeriodoController::class, 'index']);
        Route::post('periodos', [PeriodoController::class, 'store']);
        Route::put('periodos/{id}', [PeriodoController::class, 'update']);
        Route::patch('periodos/{id}/estado', [PeriodoController::class, 'cambiarEstado']);
        Route::delete('periodos/{id}', [PeriodoController::class, 'destroy']);
    });
    Route::middleware('permission:ver_selecciones|ver_catalogo|ver_empleados|gestionar_periodos')->get(
        'periodos/activo',
        [PeriodoController::class, 'activo']
    );

    // Notificaciones
    Route::middleware('permission:ver_notificaciones')->group(function () {
        Route::get('notificaciones', [NotificacionController::class, 'index']);
        Route::get('notificaciones/conteo', [NotificacionController::class, 'conteo']);
        Route::patch('notificaciones/{id}/leida', [NotificacionController::class, 'marcarLeida']);
        Route::post('notificaciones/leer-todas', [NotificacionController::class, 'marcarTodasLeidas']);
        Route::delete('notificaciones/{id}', [NotificacionController::class, 'destroy']);
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => view('spa'))->name('dashboard');
    Route::get('/dashboard/{path}', fn () => view('spa'))->where('path', '.*')->name('dashboard.catch');
});
