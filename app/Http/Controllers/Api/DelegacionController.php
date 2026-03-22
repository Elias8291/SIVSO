<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DelegacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $delegadoId = $request->get('delegado_id');
        $search     = trim((string) $request->get('search', ''));

        $query = Empleado::query()
            ->select(['id', 'nue', 'nombre', 'apellido_paterno', 'apellido_materno', 'delegacion_id', 'dependencia_id']);

        if ($delegadoId) {
            $delegacionIds = DB::table('delegado_delegacion')
                ->where('delegado_id', (int) $delegadoId)
                ->pluck('delegacion_id');

            $query->whereIn('delegacion_id', $delegacionIds);
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('nombre', 'like', "%{$search}%")
               ->orWhere('apellido_paterno', 'like', "%{$search}%")
               ->orWhere('apellido_materno', 'like', "%{$search}%")
               ->orWhere('nue', 'like', "%{$search}%")
        ));

        $rows = $query->with(['delegacion:id,clave', 'dependencia:id,clave'])
            ->orderByRaw('apellido_paterno, apellido_materno, nombre')
            ->limit(200)
            ->get();

        $data = $rows->map(fn ($e) => [
            'id'              => $e->id,
            'nue'             => $e->nue,
            'nombre_completo' => $e->nombre_completo,
            'nombre_trab'     => $e->nombre,
            'apellp_trab'     => $e->apellido_paterno,
            'apellm_trab'     => $e->apellido_materno,
            'delegacion'      => $e->delegacion?->clave,
            'ur'              => $e->dependencia?->clave,
        ]);

        return response()->json(['data' => $data]);
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

        $rows = DB::table('empleados')
            ->join('delegaciones', 'delegaciones.id', '=', 'empleados.delegacion_id')
            ->where('empleados.dependencia_id', $depId)
            ->whereNotNull('empleados.delegacion_id')
            ->selectRaw('delegaciones.clave, delegaciones.id, COUNT(empleados.id) AS trabajadores_count')
            ->groupBy('delegaciones.id', 'delegaciones.clave')
            ->orderBy('delegaciones.clave')
            ->get();

        $data = $rows->map(fn ($r) => [
            'id'                 => $r->id,
            'clave'              => $r->clave,
            'nombre'             => null,
            'trabajadores_count' => (int) $r->trabajadores_count,
        ]);

        return response()->json(['data' => $data]);
    }
}
