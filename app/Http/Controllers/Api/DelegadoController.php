<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DelegadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ur     = $request->get('ur');
        $search = trim((string) $request->get('search', ''));

        $query = DB::table('delegados AS d')
            ->join('delegado_delegacion AS dd', 'dd.delegado_id', '=', 'd.id')
            ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id');

        if ($ur) {
            $depId = DB::table('dependencias')->where('clave', $ur)->value('id');
            if ($depId) {
                $query->join('dependencia_delegacion AS dep_del', function ($j) use ($depId) {
                    $j->on('dep_del.delegacion_id', '=', 'dl.id')
                      ->where('dep_del.dependencia_id', $depId);
                });
            }
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('d.nombre', 'like', "%{$search}%")
               ->orWhere('dl.clave', 'like', "%{$search}%")
        ));

        $rows = $query->select([
                'd.id', 'd.nombre', 'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id',
            ])
            ->orderBy('d.nombre')
            ->limit(200)
            ->get();

        $delegacionIds = $rows->pluck('delegacion_id')->unique();
        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegacionIds)
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->delegacion_clave,
            'nombre'             => $d->nombre,
            'ur'                 => $ur,
            'trabajadores_count' => (int) ($trabCounts[$d->delegacion_id] ?? 0),
        ]);

        return response()->json(['data' => $data]);
    }

    public function resumen(Request $request): JsonResponse
    {
        $search = trim((string) $request->get('search', ''));

        $delegados = DB::table('delegados AS d')
            ->join('delegado_delegacion AS dd', 'dd.delegado_id', '=', 'd.id')
            ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
            ->select(['d.id', 'd.nombre', 'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id'])
            ->orderBy('d.nombre')
            ->get();

        $trabCounts = DB::table('empleados')
            ->whereNotNull('delegacion_id')
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $byNombre = [];
        foreach ($delegados as $d) {
            $key = trim($d->nombre);
            if (! isset($byNombre[$key])) {
                $byNombre[$key] = [
                    'nombre'             => $d->nombre,
                    'delegaciones_count' => 0,
                    'delegaciones'       => [],
                    'trabajadores_total' => 0,
                ];
            }

            $cnt = (int) ($trabCounts[$d->delegacion_id] ?? 0);
            $byNombre[$key]['delegaciones_count']++;
            $byNombre[$key]['delegaciones'][] = [
                'id'                 => $d->id,
                'clave'              => $d->delegacion_clave,
                'trabajadores_count' => $cnt,
            ];
            $byNombre[$key]['trabajadores_total'] += $cnt;
        }

        if ($search) {
            $byNombre = array_filter($byNombre, fn ($v) =>
                stripos($v['nombre'], $search) !== false ||
                collect($v['delegaciones'])->contains(fn ($del) => stripos($del['clave'], $search) !== false)
            );
        }

        return response()->json(['data' => array_values($byNombre)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:120',
            'delegacion_id' => 'required|integer|exists:delegaciones,id',
        ]);

        $delegado = Delegado::create([
            'nombre' => strtoupper(trim($data['nombre'])),
        ]);

        $delegado->delegaciones()->attach($data['delegacion_id']);

        return response()->json(['message' => 'Delegado creado correctamente.', 'id' => $delegado->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $data = $request->validate([
            'nombre' => 'required|string|max:120',
        ]);

        $delegado->update(['nombre' => strtoupper(trim($data['nombre']))]);

        return response()->json(['message' => 'Delegado actualizado correctamente.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $delegado->delegaciones()->detach();
        $delegado->delete();

        return response()->json(['message' => 'Delegado eliminado correctamente.']);
    }
}
