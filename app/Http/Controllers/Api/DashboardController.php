<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function resumen(Request $request): JsonResponse
    {
        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();
        $anioVigente = $periodo ? (int) $periodo->anio : (int) (DB::table('selecciones')->max('anio') ?? date('Y'));

        $seleccionesEjercicio = (int) DB::table('selecciones')->where('anio', $anioVigente)->count();

        return response()->json([
            'anio_vigente' => $anioVigente,
            'periodo_activo' => $periodo ? [
                'id' => $periodo->id,
                'anio' => (int) $periodo->anio,
                'nombre' => $periodo->nombre,
                'fecha_fin' => $periodo->fecha_fin ? $periodo->fecha_fin->format('Y-m-d') : null,
            ] : null,
            'counts' => [
                'empleados' => (int) DB::table('empleados')->count(),
                'delegaciones' => (int) DB::table('delegaciones')->count(),
                'delegados' => (int) DB::table('delegados')->count(),
                'dependencias' => (int) DB::table('dependencias')->count(),
                'productos' => (int) DB::table('productos')->count(),
                'selecciones_ejercicio' => $seleccionesEjercicio,
            ],
        ]);
    }
}

