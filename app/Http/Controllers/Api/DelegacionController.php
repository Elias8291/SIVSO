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
        $search = trim((string) $request->get('search', ''));

        $query = Delegacion::query()->withCount(['empleados', 'dependencias']);

        if ($delegadoId) {
            $delegacionIds = DB::table('delegado_delegacion')
                ->where('delegado_id', (int) $delegadoId)
                ->pluck('delegacion_id');
            $query->whereIn('id', $delegacionIds);
        }

        $query->when($search !== '' && ! $delegadoId, fn ($q) => $q->where(fn ($q2) => $q2->where('clave', 'like', "%{$search}%")
            ->orWhere('nombre', 'like', "%{$search}%")
        ));

        $rows = $query->orderBy('clave')->get();

        if ($delegadoId) {
            $delegacionIds = $rows->pluck('id')->all();
            if ($delegacionIds === []) {
                return response()->json(['data' => []]);
            }

            $delegadoRow = DB::table('delegados')->where('id', (int) $delegadoId)->first();
            $delegadoLabel = $delegadoRow && trim((string) ($delegadoRow->nombre ?? '')) !== ''
                ? trim($delegadoRow->nombre)
                : ('Delegado #'.(int) $delegadoId);

            $empQuery = Empleado::query()
                ->with(['delegacion:id,clave'])
                ->whereIn('delegacion_id', $delegacionIds);

            $empQuery->when($search, fn ($q) => $q->where(fn ($q2) => $q2->where('nue', 'like', "%{$search}%")
                ->orWhere('nombre', 'like', "%{$search}%")
                ->orWhere('apellido_paterno', 'like', "%{$search}%")
                ->orWhere('apellido_materno', 'like', "%{$search}%")
            )
            );

            $empleados = $empQuery
                ->orderByRaw('apellido_paterno, apellido_materno, nombre')
                ->limit(500)
                ->get();

            $data = $empleados->map(fn (Empleado $e) => [
                'id' => $e->id,
                'nue' => $e->nue,
                'nombre_completo' => $e->nombre_completo,
                'delegacion' => $e->delegacion?->clave ?? '',
                'delegado_label' => $delegadoLabel,
            ]);

            return response()->json(['data' => $data]);
        }

        $delegacionIds = $rows->pluck('id')->all();
        $nombresPorDelegacion = [];
        if ($delegacionIds !== []) {
            $pairs = DB::table('delegado_delegacion AS dd')
                ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                ->whereIn('dd.delegacion_id', $delegacionIds)
                ->orderBy('d.nombre')
                ->get(['dd.delegacion_id', 'd.nombre']);

            foreach ($pairs as $p) {
                $id = (int) $p->delegacion_id;
                $nom = trim((string) ($p->nombre ?? ''));
                if ($nom === '') {
                    continue;
                }
                $nombresPorDelegacion[$id] ??= [];
                if (! in_array($nom, $nombresPorDelegacion[$id], true)) {
                    $nombresPorDelegacion[$id][] = $nom;
                }
            }
        }

        $data = $rows->map(fn ($d) => [
            'id' => $d->id,
            'clave' => $d->clave,
            'nombre' => $d->nombre,
            'dependencias_count' => $d->dependencias_count,
            'empleados_count' => $d->empleados_count,
            'delegados_nombres' => $nombresPorDelegacion[$d->id] ?? [],
        ]);

        return response()->json(['data' => $data]);
    }

    public function show(int $id): JsonResponse
    {
        $d = Delegacion::query()->withCount('empleados')->find($id);
        if (! $d) {
            return response()->json(['message' => 'Delegación no encontrada.'], 404);
        }

        $nombres = DB::table('delegado_delegacion AS dd')
            ->join('delegados AS del', 'del.id', '=', 'dd.delegado_id')
            ->where('dd.delegacion_id', $d->id)
            ->orderBy('del.nombre')
            ->pluck('del.nombre');

        $delegadosNombres = $nombres
            ->map(fn ($n) => trim((string) $n))
            ->filter(fn ($n) => $n !== '')
            ->unique()
            ->values()
            ->all();

        $dependenciasRows = DB::table('dependencia_delegacion AS ddel')
            ->join('dependencias AS dep', 'dep.id', '=', 'ddel.dependencia_id')
            ->where('ddel.delegacion_id', $d->id)
            ->orderBy('dep.clave')
            ->get(['dep.clave', 'dep.nombre']);

        $dependencias = $dependenciasRows->map(fn ($row) => [
            'clave' => $row->clave,
            'nombre' => $row->nombre,
        ])->values()->all();

        return response()->json([
            'data' => [
                'id' => $d->id,
                'clave' => $d->clave,
                'nombre' => $d->nombre,
                'empleados_count' => $d->empleados_count,
                'delegados_nombres' => $delegadosNombres,
                'dependencias' => $dependencias,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'clave' => 'required|string|max:20|unique:delegaciones,clave',
            'nombre' => 'nullable|string|max:255',
        ]);

        $del = Delegacion::create([
            'clave' => strtoupper(trim($data['clave'])),
            'nombre' => $data['nombre'] ?? null,
        ]);

        return response()->json(['message' => 'Delegación creada correctamente.', 'id' => $del->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $del = Delegacion::findOrFail($id);

        $data = $request->validate([
            'clave' => ['required', 'string', 'max:20', Rule::unique('delegaciones', 'clave')->ignore($del->id)],
            'nombre' => 'nullable|string|max:255',
        ]);

        $del->update([
            'clave' => strtoupper(trim($data['clave'])),
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
            'id' => $r->id,
            'clave' => $r->clave,
            'nombre' => $r->nombre,
            'trabajadores_count' => (int) $r->trabajadores_count,
        ]);

        return response()->json(['data' => $data]);
    }
}
