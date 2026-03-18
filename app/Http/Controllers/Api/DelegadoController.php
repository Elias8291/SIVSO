<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabla: delegado (id, nombre, delegacion, ur)
 * Panel 2 de la página Organización: delegados de una UR (Unidad Receptora).
 *
 * delegado.ur        = dependences.key (relación numérica, conversión implícita en MySQL)
 * delegado.delegacion = REPLACE(delegacion.delegacion, '-', '')
 *   Ej: delegado.delegacion = "3B101"  →  delegacion.delegacion = "3B-101"
 */
class DelegadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ur     = $request->get('ur');
        $search = trim((string) $request->get('search', ''));

        $query = DB::table('delegado');

        if ($ur) {
            $query->where('ur', (int) $ur);
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('nombre', 'like', "%{$search}%")
               ->orWhere('delegacion', 'like', "%{$search}%")
        ));

        $rows = $query->orderBy('ur')->orderBy('nombre')
            ->limit(200)
            ->get(['id', 'nombre', 'delegacion', 'ur']);

        if ($rows->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // Contar trabajadores por (ur, delegacion sin guión)
        $trabCounts = DB::table('delegacion')
            ->selectRaw("ur, REPLACE(delegacion, '-', '') AS del_code, COUNT(*) AS cnt")
            ->groupByRaw("ur, REPLACE(delegacion, '-', '')")
            ->get()
            ->keyBy(fn ($r) => "{$r->ur}_{$r->del_code}");

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->delegacion,   // código ej: "3B101"
            'nombre'             => $d->nombre,
            'ur'                 => $d->ur,
            'trabajadores_count' => (int) ($trabCounts->get("{$d->ur}_{$d->delegacion}")?->cnt ?? 0),
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/delegados/resumen
     * Delegados agrupados por nombre con cuántas delegaciones representa cada uno.
     */
    public function resumen(Request $request): JsonResponse
    {
        $conn   = 'bas_vestuario';
        $search = trim((string) $request->get('search', ''));

        $trabCounts = DB::connection($conn)->table('delegacion')
            ->selectRaw("ur, REPLACE(delegacion, '-', '') AS del_code, COUNT(*) AS cnt")
            ->groupByRaw("ur, REPLACE(delegacion, '-', '')")
            ->get()
            ->keyBy(fn ($r) => "{$r->ur}_{$r->del_code}");

        $delegadoRows = DB::connection($conn)->table('delegado')
            ->orderBy('nombre')
            ->orderBy('ur')
            ->get(['id', 'nombre', 'delegacion', 'ur']);

        $byNombre = [];
        foreach ($delegadoRows as $d) {
            $key     = trim($d->nombre);
            $delCode = str_replace('-', '', (string) $d->delegacion);
            $delKey  = $d->ur . '_' . $delCode; // delegación distinta = UR + clave única

            if (! isset($byNombre[$key])) {
                $byNombre[$key] = [
                    'nombre'             => $d->nombre,
                    'delegaciones_count' => 0,
                    'delegaciones'       => [],
                    'trabajadores_total' => 0,
                    '_seen'              => [], // claves ya agregadas (delegaciones distintas)
                ];
            }

            if (isset($byNombre[$key]['_seen'][$delKey])) {
                continue; // ya contamos esta delegación (clave + UR)
            }
            $byNombre[$key]['_seen'][$delKey] = true;

            $cnt = (int) ($trabCounts->get($delKey)?->cnt ?? 0);
            $byNombre[$key]['delegaciones_count']++;
            $byNombre[$key]['delegaciones'][] = [
                'id'                 => $d->id,
                'clave'              => $d->delegacion,
                'ur'                 => $d->ur,
                'trabajadores_count' => $cnt,
            ];
            $byNombre[$key]['trabajadores_total'] += $cnt;
        }

        if ($search) {
            $byNombre = array_filter($byNombre, fn ($v) =>
                stripos($v['nombre'], $search) !== false ||
                collect($v['delegaciones'])->some(fn ($del) => stripos($del['clave'], $search) !== false)
            );
        }

        $data = array_values(array_map(fn ($v) => [
            'nombre'             => $v['nombre'],
            'delegaciones_count' => $v['delegaciones_count'],
            'delegaciones'       => $v['delegaciones'],
            'trabajadores_total' => $v['trabajadores_total'],
        ], $byNombre));

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'     => 'required|string|max:120',
            'delegacion' => 'required|string|max:25',
            'ur'         => 'required|integer',
        ]);

        $id = DB::table('delegado')->insertGetId([
            'nombre'    => strtoupper(trim($data['nombre'])),
            'delegacion'=> strtoupper(trim($data['delegacion'])),
            'ur'        => (int) $data['ur'],
        ]);

        return response()->json(['message' => 'Delegado creado correctamente.', 'id' => $id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $delegado = DB::table('delegado')->where('id', $id)->first();
        if (!$delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $data = $request->validate([
            'nombre'     => 'required|string|max:120',
            'delegacion' => 'required|string|max:25',
        ]);

        DB::table('delegado')->where('id', $id)->update([
            'nombre'    => strtoupper(trim($data['nombre'])),
            'delegacion'=> strtoupper(trim($data['delegacion'])),
        ]);

        return response()->json(['message' => 'Delegado actualizado correctamente.']);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::table('delegado')->where('id', $id)->delete();
        return response()->json(['message' => 'Delegado eliminado correctamente.']);
    }
}
