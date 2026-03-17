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

        if (!$ur) {
            return response()->json(['data' => []]);
        }

        $rows = DB::table('delegado')
            ->where('ur', (int) $ur)
            ->when($search, fn ($q) => $q->where('nombre', 'like', "%{$search}%"))
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'delegacion', 'ur']);

        if ($rows->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // Contar trabajadores por código de delegación (quitando guión de delegacion.delegacion)
        $trabCounts = DB::table('delegacion')
            ->where('ur', (int) $ur)
            ->selectRaw("REPLACE(delegacion, '-', '') AS del_code, COUNT(*) AS cnt")
            ->groupByRaw("REPLACE(delegacion, '-', '')")
            ->pluck('cnt', 'del_code');

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->delegacion,   // código ej: "3B101"
            'nombre'             => $d->nombre,
            'ur'                 => $d->ur,
            'trabajadores_count' => (int) $trabCounts->get($d->delegacion, 0),
        ]);

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
