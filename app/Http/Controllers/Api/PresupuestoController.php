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

        $anioDemandaReferencia = $anio - 1;

        // Gasto del ejercicio consultado: selecciones del año × precios del mismo año
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
                DB::raw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0) * 1.16) AS gastado_iva'),
                DB::raw('SUM(s.cantidad) AS total_cantidad'),
                DB::raw('COUNT(s.id) AS registros'),
            ])
            ->groupBy('e.dependencia_id', 'pa.numero')
            ->get();

        // Estimado: mismas cantidades del año anterior, valoradas con precios del ejercicio consultado
        $estimados = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->leftJoin('producto_precios AS pp', function ($j) use ($anio) {
                $j->on('pp.producto_id', '=', 'p.id')->where('pp.anio', '=', $anio);
            })
            ->where('s.anio', $anioDemandaReferencia)
            ->select([
                'e.dependencia_id',
                'pa.numero AS partida',
                DB::raw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0)) AS estimado'),
                DB::raw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0) * 1.16) AS estimado_iva'),
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

        $partidas = $gastados->pluck('partida')
            ->merge($estimados->pluck('partida'))
            ->unique()
            ->sort()
            ->values();

        $gastadoMap = [];
        $gastadoIvaMap = [];
        $cantidadMap = [];
        $registrosMap = [];
        foreach ($gastados as $g) {
            $key = "{$g->dependencia_id}_{$g->partida}";
            $gastadoMap[$key] = (float) $g->gastado;
            $gastadoIvaMap[$key] = (float) $g->gastado_iva;
            $cantidadMap[$key] = (int) $g->total_cantidad;
            $registrosMap[$key] = (int) $g->registros;
        }

        $estimadoMap = [];
        $estimadoIvaMap = [];
        foreach ($estimados as $g) {
            $key = "{$g->dependencia_id}_{$g->partida}";
            $estimadoMap[$key] = (float) $g->estimado;
            $estimadoIvaMap[$key] = (float) $g->estimado_iva;
        }

        $rows = $dependencias->map(function ($dep) use ($partidas, $gastadoMap, $gastadoIvaMap, $cantidadMap, $registrosMap, $estimadoMap, $estimadoIvaMap, $trabPorDep) {
            $columnas = [];
            $totalGastado = 0;
            $totalGastadoIva = 0;
            $totalEstimado = 0;
            $totalEstimadoIva = 0;
            $totalPiezas = 0;

            foreach ($partidas as $pa) {
                $key = "{$dep->id}_{$pa}";
                $gastado = $gastadoMap[$key] ?? 0;
                $gastadoIva = $gastadoIvaMap[$key] ?? 0;
                $estimado = $estimadoMap[$key] ?? 0;
                $estimadoIva = $estimadoIvaMap[$key] ?? 0;
                $pendiente = max(0, round($estimado - $gastado, 2));
                $pendienteIva = max(0, round($estimadoIva - $gastadoIva, 2));
                $cantidad = $cantidadMap[$key] ?? 0;

                $columnas[] = [
                    'partida_especifica' => $pa,
                    'gastado' => round($gastado, 2),
                    'gastado_iva' => round($gastadoIva, 2),
                    'estimado' => round($estimado, 2),
                    'estimado_iva' => round($estimadoIva, 2),
                    'pendiente' => $pendiente,
                    'pendiente_iva' => $pendienteIva,
                    'cantidad' => $cantidad,
                    'registros' => $registrosMap[$key] ?? 0,
                    'limite' => 0,
                    'porcentaje' => null,
                ];

                $totalGastado += $gastado;
                $totalGastadoIva += $gastadoIva;
                $totalEstimado += $estimado;
                $totalEstimadoIva += $estimadoIva;
                $totalPiezas += $cantidad;
            }

            return [
                'ur' => $dep->clave,
                'nombre' => $dep->nombre,
                'trabajadores' => (int) ($trabPorDep[$dep->id] ?? 0),
                'columnas' => $columnas,
                'total_gastado' => round($totalGastado, 2),
                'total_gastado_iva' => round($totalGastadoIva, 2),
                'total_estimado' => round($totalEstimado, 2),
                'total_estimado_iva' => round($totalEstimadoIva, 2),
                'total_pendiente' => max(0, round($totalEstimado - $totalGastado, 2)),
                'total_pendiente_iva' => max(0, round($totalEstimadoIva - $totalGastadoIva, 2)),
                'total_piezas' => $totalPiezas,
                'total_limite' => 0,
                'total_pct' => null,
            ];
        })->filter(fn ($r) => $r['total_gastado'] > 0 || $r['total_estimado'] > 0)->values();

        $totalesGlobales = $partidas->map(function ($pa) use ($gastadoMap, $gastadoIvaMap, $cantidadMap, $estimadoMap, $estimadoIvaMap, $dependencias) {
            $gastado = 0;
            $gastadoIva = 0;
            $estimado = 0;
            $estimadoIva = 0;
            $cantidad = 0;
            foreach ($dependencias as $dep) {
                $key = "{$dep->id}_{$pa}";
                $gastado += $gastadoMap[$key] ?? 0;
                $gastadoIva += $gastadoIvaMap[$key] ?? 0;
                $estimado += $estimadoMap[$key] ?? 0;
                $estimadoIva += $estimadoIvaMap[$key] ?? 0;
                $cantidad += $cantidadMap[$key] ?? 0;
            }
            $pendiente = max(0, round($estimado - $gastado, 2));
            $pendienteIva = max(0, round($estimadoIva - $gastadoIva, 2));

            return [
                'partida_especifica' => $pa,
                'gastado' => round($gastado, 2),
                'gastado_iva' => round($gastadoIva, 2),
                'estimado' => round($estimado, 2),
                'estimado_iva' => round($estimadoIva, 2),
                'pendiente' => $pendiente,
                'pendiente_iva' => $pendienteIva,
                'cantidad' => $cantidad,
                'limite' => 0,
                'porcentaje' => null,
            ];
        });

        return response()->json([
            'anio' => $anio,
            'anio_demanda_referencia' => $anioDemandaReferencia,
            'anios_disponibles' => $aniosDisponibles,
            'partidas' => $partidas,
            'rows' => $rows->values(),
            'totales_globales' => $totalesGlobales->values(),
        ]);
    }

    public function setLimite(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Funcionalidad de límites en desarrollo.'], 501);
    }
}
