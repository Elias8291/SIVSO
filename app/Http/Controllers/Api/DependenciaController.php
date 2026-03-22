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

        $rows = Dependencia::query()
            ->select(['id', 'clave', 'nombre'])
            ->when($search, fn ($q) =>
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('clave', 'like', "%{$search}%")
            )
            ->withCount(['empleados', 'delegaciones'])
            ->orderBy('nombre')
            ->get();

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->clave,
            'nombre'             => $d->nombre,
            'delegados_count'    => $d->delegaciones_count,
            'trabajadores_count' => $d->empleados_count,
        ])
        ->sortByDesc(fn ($d) => $d['delegados_count'] * 1_000_000 + $d['trabajadores_count'])
        ->values();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'clave'  => 'required|string|max:20|unique:dependencias,clave',
            'nombre' => 'required|string|max:255',
        ]);

        $dep = Dependencia::create([
            'clave'  => strtoupper(trim($data['clave'])),
            'nombre' => $data['nombre'],
        ]);

        return response()->json(['message' => 'Dependencia creada correctamente.', 'id' => $dep->id], 201);
    }

    public function update(Request $request, Dependencia $dependencia): JsonResponse
    {
        $data = $request->validate([
            'clave'  => ['required', 'string', 'max:20', Rule::unique('dependencias', 'clave')->ignore($dependencia->id)],
            'nombre' => 'required|string|max:255',
        ]);

        $dependencia->update([
            'clave'  => strtoupper(trim($data['clave'])),
            'nombre' => $data['nombre'],
        ]);

        return response()->json(['message' => 'Dependencia actualizada correctamente.']);
    }

    public function destroy(Dependencia $dependencia): JsonResponse
    {
        if ($dependencia->empleados()->exists()) {
            return response()->json(['message' => 'No se puede eliminar: tiene trabajadores registrados.'], 422);
        }

        $dependencia->delete();
        return response()->json(['message' => 'Dependencia eliminada correctamente.']);
    }
}
