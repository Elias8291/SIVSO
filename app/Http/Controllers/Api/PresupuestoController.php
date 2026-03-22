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
        $anio = (int) ($request->query('anio', date('Y')));

        $dependencias = DB::table('dependencias')->orderBy('clave')->get(['id', 'clave', 'nombre']);

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
                DB::raw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0)) AS gastado'),
                DB::raw('COUNT(DISTINCT e.id) AS trabajadores'),
                DB::raw('COUNT(s.id) AS registros'),
            ])
            ->groupBy('e.dependencia_id', 'pa.numero')
            ->get();

        $partidas = $gastados->pluck('partida')->unique()->sort()->values();

        $gastadoMap = [];
        $trabajadoresMap = [];
        foreach ($gastados as $g) {
            $key = "{$g->dependencia_id}_{$g->partida}";
            $gastadoMap[$key] = (float) $g->gastado;
            $trabajadoresMap[$g->dependencia_id] = ($trabajadoresMap[$g->dependencia_id] ?? 0) + (int) $g->trabajadores;
        }

        $rows = $dependencias->map(function ($dep) use ($partidas, $gastadoMap, $trabajadoresMap) {
            $columnas = [];
            $totalGastado = 0;

            foreach ($partidas as $pa) {
                $key     = "{$dep->id}_{$pa}";
                $gastado = $gastadoMap[$key] ?? 0;

                $columnas[] = [
                    'partida_especifica' => $pa,
                    'gastado'            => $gastado,
                    'limite'             => 0,
                    'porcentaje'         => null,
                ];

                $totalGastado += $gastado;
            }

            return [
                'ur'            => $dep->clave,
                'nombre'        => $dep->nombre,
                'trabajadores'  => $trabajadoresMap[$dep->id] ?? 0,
                'columnas'      => $columnas,
                'total_gastado' => $totalGastado,
                'total_limite'  => 0,
                'total_pct'     => null,
            ];
        });

        $totalesGlobales = $partidas->map(function ($pa) use ($gastadoMap, $dependencias) {
            $gastado = 0;
            foreach ($dependencias as $dep) {
                $gastado += $gastadoMap["{$dep->id}_{$pa}"] ?? 0;
            }
            return [
                'partida_especifica' => $pa,
                'gastado'            => $gastado,
                'limite'             => 0,
                'porcentaje'         => null,
            ];
        });

        return response()->json([
            'anio'             => $anio,
            'partidas'         => $partidas,
            'rows'             => $rows->values(),
            'totales_globales' => $totalesGlobales->values(),
        ]);
    }

    public function setLimite(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Funcionalidad de límites en desarrollo.'], 501);
    }
}
