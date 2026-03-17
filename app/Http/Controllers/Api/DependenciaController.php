<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dependencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DependenciaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->get('search', ''));

        $rows = DB::table('dependences')
            ->select(['id', 'key', 'name'])
            ->orderBy('name')
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('key',  'like', "%{$search}%")
                )
            )
            ->get();

        if ($rows->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // ur en delegado y delegacion es int, key en dependences es varchar — MySQL hace la conversión
        $keys = $rows->pluck('key')->all();

        $delCounts = DB::table('delegado')
            ->whereIn('ur', $keys)
            ->selectRaw('ur, COUNT(*) AS cnt')
            ->groupBy('ur')
            ->pluck('cnt', 'ur');

        $trabCounts = DB::table('delegacion')
            ->whereIn('ur', $keys)
            ->selectRaw('ur, COUNT(*) AS cnt')
            ->groupBy('ur')
            ->pluck('cnt', 'ur');

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->key,
            'nombre'             => $d->name,
            'delegados_count'    => (int) $delCounts->get($d->key, 0),
            'trabajadores_count' => (int) $trabCounts->get($d->key, 0),
        ])
        ->sortByDesc(fn ($d) => $d['delegados_count'] * 1_000_000 + $d['trabajadores_count'])
        ->values();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'clave'  => 'required|string|max:5|unique:dependences,key',
            'nombre' => 'required|string|max:255',
        ]);

        $dep = Dependencia::create([
            'key'  => strtoupper(trim($data['clave'])),
            'name' => $data['nombre'],
        ]);

        return response()->json(['message' => 'Dependencia creada correctamente.', 'id' => $dep->id], 201);
    }

    public function update(Request $request, Dependencia $dependencia): JsonResponse
    {
        $data = $request->validate([
            'clave'  => ['required', 'string', 'max:5', Rule::unique('dependences', 'key')->ignore($dependencia->id)],
            'nombre' => 'required|string|max:255',
        ]);

        $dependencia->update([
            'key'  => strtoupper(trim($data['clave'])),
            'name' => $data['nombre'],
        ]);

        return response()->json(['message' => 'Dependencia actualizada correctamente.']);
    }

    public function destroy(Dependencia $dependencia): JsonResponse
    {
        if (DB::table('delegado')->where('ur', $dependencia->key)->exists()) {
            return response()->json(['message' => 'No se puede eliminar: tiene delegados registrados.'], 422);
        }

        if (DB::table('delegacion')->where('ur', $dependencia->key)->exists()) {
            return response()->json(['message' => 'No se puede eliminar: tiene trabajadores registrados.'], 422);
        }

        $dependencia->delete();
        return response()->json(['message' => 'Dependencia eliminada correctamente.']);
    }
}
