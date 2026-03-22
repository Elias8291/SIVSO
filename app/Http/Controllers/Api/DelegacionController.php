<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\Empleado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DelegacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $delegadoId = $request->get('delegado_id');
        $search     = trim((string) $request->get('search', ''));

        $query = Delegacion::query()->withCount('empleados');

        if ($delegadoId) {
            $delegacionIds = DB::table('delegado_delegacion')
                ->where('delegado_id', (int) $delegadoId)
                ->pluck('delegacion_id');
            $query->whereIn('id', $delegacionIds);
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('clave', 'like', "%{$search}%")
               ->orWhere('nombre', 'like', "%{$search}%")
        ));

        $rows = $query->orderBy('clave')->get();

        if ($delegadoId) {
            $data = $rows->map(fn ($d) => [
                'id'              => $d->id,
                'nue'             => null,
                'nombre_completo' => $d->clave . ($d->nombre ? " — {$d->nombre}" : ''),
                'nombre_trab'     => $d->clave,
                'apellp_trab'     => $d->nombre,
                'apellm_trab'     => null,
                'delegacion'      => $d->clave,
                'ur'              => null,
            ]);
            return response()->json(['data' => $data]);
        }

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->clave,
            'nombre'             => $d->nombre,
            'empleados_count'    => $d->empleados_count,
        ]);

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'clave'  => 'required|string|max:20|unique:delegaciones,clave',
            'nombre' => 'nullable|string|max:255',
        ]);

        $del = Delegacion::create([
            'clave'  => strtoupper(trim($data['clave'])),
            'nombre' => $data['nombre'] ?? null,
        ]);

        return response()->json(['message' => 'Delegación creada correctamente.', 'id' => $del->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $del = Delegacion::findOrFail($id);

        $data = $request->validate([
            'clave'  => ['required', 'string', 'max:20', Rule::unique('delegaciones', 'clave')->ignore($del->id)],
            'nombre' => 'nullable|string|max:255',
        ]);

        $del->update([
            'clave'  => strtoupper(trim($data['clave'])),
            'nombre' => $data['nombre'] ?? null,
        ]);

        return response()->json(['message' => 'Delegación actualizada correctamente.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $del = Delegacion::findOrFail($id);

        if ($del->empleados()->exists()) {
            return response()->json(['message' => 'No se puede eliminar: tiene empleados asignados.'], 422);
        }

        $del->delegados()->detach();
        $del->dependencias()->detach();
        $del->delete();

        return response()->json(['message' => 'Delegación eliminada correctamente.']);
    }

    public function codigos(Request $request): JsonResponse
    {
        $ur = $request->get('ur') ?? $request->get('dependencia_clave');

        if (! $ur) {
            return response()->json(['data' => []]);
        }

        $depId = DB::table('dependencias')->where('clave', $ur)->value('id');
        if (! $depId) {
            return response()->json(['data' => []]);
        }

        $rows = DB::table('delegaciones AS dl')
            ->join('dependencia_delegacion AS dd', 'dd.delegacion_id', '=', 'dl.id')
            ->where('dd.dependencia_id', $depId)
            ->leftJoin(DB::raw('(SELECT delegacion_id, COUNT(*) AS cnt FROM empleados GROUP BY delegacion_id) AS ec'), 'ec.delegacion_id', '=', 'dl.id')
            ->select(['dl.id', 'dl.clave', 'dl.nombre', DB::raw('COALESCE(ec.cnt, 0) AS trabajadores_count')])
            ->orderBy('dl.clave')
            ->get();

        $data = $rows->map(fn ($r) => [
            'id'                 => $r->id,
            'clave'              => $r->clave,
            'nombre'             => $r->nombre,
            'trabajadores_count' => (int) $r->trabajadores_count,
        ]);

        return response()->json(['data' => $data]);
    }
}
