<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PresupuestoController extends Controller
{
    /**
     * Pivot: gasto real por UR × partida_especifica + límites configurados.
     * GET /api/partidas?anio=2025
     */
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $anio = (int) ($request->query('anio', date('Y')));

        // 1. Todas las dependencias
        $dependencias = DB::table('dependences')
            ->orderBy('key')
            ->get(['key', 'name']);

        // 2. Gasto real: concentrado ⟶ propuesta (subquery MIN para evitar multiplicación)
        $gastados = DB::table('concentrado as c')
            ->leftJoin(
                DB::raw('(SELECT partida, MIN(partida_especifica) as partida_especifica FROM propuesta GROUP BY partida) as pp'),
                'pp.partida',
                '=',
                'c.no_partida'
            )
            ->select([
                'c.ur',
                DB::raw('COALESCE(pp.partida_especifica, 0) as partida_especifica'),
                DB::raw('SUM(COALESCE(c.total, 0)) as gastado'),
                DB::raw('SUM(COALESCE(c.importe, 0)) as importe'),
                DB::raw('COUNT(DISTINCT c.nue) as trabajadores'),
                DB::raw('COUNT(c.id) as registros'),
            ])
            ->groupBy('c.ur', DB::raw('COALESCE(pp.partida_especifica, 0)'))
            ->get();

        // 3. Límites guardados para el año solicitado
        $limites = DB::table('presupuesto_limites')
            ->where('anio', $anio)
            ->get(['ur', 'partida_especifica', 'limite']);

        // 4. Partidas específicas distintas (excluimos 0 = sin mapeo)
        $partidas = $gastados
            ->pluck('partida_especifica')
            ->filter(fn ($v) => $v > 0)
            ->unique()
            ->sort()
            ->values();

        // 5. Construcción del pivot por UR
        $limiteMap = [];
        foreach ($limites as $l) {
            $limiteMap["{$l->ur}_{$l->partida_especifica}"] = (float) $l->limite;
        }

        $gastadoMap = [];
        $trabajadoresMap = [];
        foreach ($gastados as $g) {
            $key = "{$g->ur}_{$g->partida_especifica}";
            $gastadoMap[$key] = (float) $g->gastado;
            $trabajadoresMap[$g->ur] = ($trabajadoresMap[$g->ur] ?? 0) + (int) $g->trabajadores;
        }

        $rows = $dependencias->map(function ($dep) use ($partidas, $gastadoMap, $limiteMap, $trabajadoresMap) {
            $columnas = [];
            $totalGastado = 0;
            $totalLimite  = 0;

            foreach ($partidas as $pe) {
                $key     = "{$dep->key}_{$pe}";
                $gastado = $gastadoMap[$key] ?? 0;
                $limite  = $limiteMap[$key]  ?? 0;

                $columnas[] = [
                    'partida_especifica' => $pe,
                    'gastado'            => $gastado,
                    'limite'             => $limite,
                    'porcentaje'         => $limite > 0 ? min(round(($gastado / $limite) * 100, 1), 999) : null,
                ];

                $totalGastado += $gastado;
                $totalLimite  += $limite;
            }

            return [
                'ur'           => $dep->key,
                'nombre'       => $dep->name,
                'trabajadores' => $trabajadoresMap[$dep->key] ?? 0,
                'columnas'     => $columnas,
                'total_gastado'=> $totalGastado,
                'total_limite' => $totalLimite,
                'total_pct'    => $totalLimite > 0
                    ? min(round(($totalGastado / $totalLimite) * 100, 1), 999)
                    : null,
            ];
        });

        // Totales globales por partida específica
        $totalesGlobales = $partidas->map(function ($pe) use ($gastadoMap, $limiteMap, $dependencias) {
            $gastado = 0;
            $limite  = 0;
            foreach ($dependencias as $dep) {
                $gastado += $gastadoMap["{$dep->key}_{$pe}"] ?? 0;
                $limite  += $limiteMap["{$dep->key}_{$pe}"]  ?? 0;
            }
            return [
                'partida_especifica' => $pe,
                'gastado'            => $gastado,
                'limite'             => $limite,
                'porcentaje'         => $limite > 0 ? min(round(($gastado / $limite) * 100, 1), 999) : null,
            ];
        });

        return response()->json([
            'anio'            => $anio,
            'partidas'        => $partidas->values(),
            'rows'            => $rows->values(),
            'totales_globales'=> $totalesGlobales->values(),
        ]);
    }

    /**
     * Guardar / actualizar límites de una UR para el año dado.
     * PUT /api/partidas/limite
     * Body: { ur, anio, limites: [{ partida_especifica, limite }] }
     */
    public function setLimite(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'ur'                           => 'required|string|max:10',
            'anio'                         => 'required|integer|min:2020|max:2099',
            'limites'                      => 'required|array|min:1',
            'limites.*.partida_especifica' => 'required|integer',
            'limites.*.limite'             => 'required|numeric|min:0',
        ]);

        foreach ($validated['limites'] as $item) {
            DB::table('presupuesto_limites')->updateOrInsert(
                [
                    'ur'                 => $validated['ur'],
                    'partida_especifica' => $item['partida_especifica'],
                    'anio'               => $validated['anio'],
                ],
                [
                    'limite'     => $item['limite'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return response()->json(['ok' => true]);
    }
}
