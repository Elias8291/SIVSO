<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PresupuestoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $aniosDisponibles = DB::table('selecciones')
            ->distinct()
            ->pluck('anio')
            ->sort()
            ->values()
            ->toArray();

        $anio = $request->has('anio')
            ? (int) $request->query('anio')
            : (count($aniosDisponibles) ? max($aniosDisponibles) : (int) date('Y'));

        $dependencias = DB::table('dependencias')->orderBy('clave')->get(['id', 'clave', 'nombre']);

        // Gasto por dependencia + partida: SUM(cantidad * precio_unitario)
        $gastados = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->where('s.anio', $anio)
            ->select([
                'e.dependencia_id',
                'pa.numero AS partida',
                DB::raw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0) * 1.16) AS gastado'),
                DB::raw('SUM(s.cantidad) AS total_cantidad'),
                DB::raw('COUNT(s.id) AS registros'),
            ])
            ->groupBy('e.dependencia_id', 'pa.numero')
            ->get();

        // Trabajadores únicos por dependencia (sin doble-conteo entre partidas)
        $trabPorDep = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->where('s.anio', $anio)
            ->select(['e.dependencia_id', DB::raw('COUNT(DISTINCT e.id) AS trabajadores')])
            ->groupBy('e.dependencia_id')
            ->pluck('trabajadores', 'dependencia_id');

        $partidas = $gastados->pluck('partida')->unique()->sort()->values();

        $gastadoMap   = [];
        $cantidadMap  = [];
        $registrosMap = [];
        foreach ($gastados as $g) {
            $key = "{$g->dependencia_id}_{$g->partida}";
            $gastadoMap[$key]   = (float) $g->gastado;
            $cantidadMap[$key]  = (int) $g->total_cantidad;
            $registrosMap[$key] = (int) $g->registros;
        }

        $rows = $dependencias->map(function ($dep) use ($partidas, $gastadoMap, $cantidadMap, $registrosMap, $trabPorDep) {
            $columnas = [];
            $totalGastado  = 0;
            $totalPiezas   = 0;

            foreach ($partidas as $pa) {
                $key      = "{$dep->id}_{$pa}";
                $gastado  = $gastadoMap[$key] ?? 0;
                $cantidad = $cantidadMap[$key] ?? 0;

                $columnas[] = [
                    'partida_especifica' => $pa,
                    'gastado'            => round($gastado, 2),
                    'cantidad'           => $cantidad,
                    'registros'          => $registrosMap[$key] ?? 0,
                    'limite'             => 0,
                    'porcentaje'         => null,
                ];

                $totalGastado += $gastado;
                $totalPiezas  += $cantidad;
            }

            return [
                'ur'            => $dep->clave,
                'nombre'        => $dep->nombre,
                'trabajadores'  => (int) ($trabPorDep[$dep->id] ?? 0),
                'columnas'      => $columnas,
                'total_gastado' => round($totalGastado, 2),
                'total_piezas'  => $totalPiezas,
                'total_limite'  => 0,
                'total_pct'     => null,
            ];
        })->filter(fn ($r) => $r['total_gastado'] > 0)->values();

        $totalesGlobales = $partidas->map(function ($pa) use ($gastadoMap, $cantidadMap, $dependencias) {
            $gastado  = 0;
            $cantidad = 0;
            foreach ($dependencias as $dep) {
                $key = "{$dep->id}_{$pa}";
                $gastado  += $gastadoMap[$key] ?? 0;
                $cantidad += $cantidadMap[$key] ?? 0;
            }
            return [
                'partida_especifica' => $pa,
                'gastado'            => round($gastado, 2),
                'cantidad'           => $cantidad,
                'limite'             => 0,
                'porcentaje'         => null,
            ];
        });

        return response()->json([
            'anio'              => $anio,
            'anios_disponibles' => $aniosDisponibles,
            'partidas'          => $partidas,
            'rows'              => $rows->values(),
            'totales_globales'  => $totalesGlobales->values(),
        ]);
    }

    public function setLimite(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Funcionalidad de límites en desarrollo.'], 501);
    }
}
