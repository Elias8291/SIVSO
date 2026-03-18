<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabla: delegacion (id, nombre_trab, apellp_trab, apellm_trab, nue, ur, dependencia, delegacion)
 * Panel 3 de la página Organización: trabajadores asignados a un delegado.
 *
 * La relación con delegado:
 *   REPLACE(delegacion.delegacion, '-', '') = delegado.delegacion
 *   delegacion.ur = delegado.ur
 */
class DelegacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $delegadoId = $request->get('delegado_id');
        $search     = trim((string) $request->get('search', ''));

        $query = DB::table('delegacion');

        if ($delegadoId) {
            $delegado = DB::table('delegado')->where('id', (int) $delegadoId)->first();
            if ($delegado) {
                $query->whereRaw("REPLACE(delegacion, '-', '') = ?", [$delegado->delegacion])
                      ->where('ur', $delegado->ur);
            }
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('nombre_trab',  'like', "%{$search}%")
               ->orWhere('apellp_trab', 'like', "%{$search}%")
               ->orWhere('apellm_trab', 'like', "%{$search}%")
               ->orWhere('nue',         'like', "%{$search}%")
        ));

        $rows = $query->orderByRaw('apellp_trab, apellm_trab, nombre_trab')
            ->limit(200)
            ->get(['id', 'nue', 'nombre_trab', 'apellp_trab', 'apellm_trab', 'delegacion', 'ur']);

        $data = $rows->map(fn ($t) => [
            'id'             => $t->id,
            'nue'            => $t->nue,
            'nombre_completo'=> trim("{$t->nombre_trab} {$t->apellp_trab} {$t->apellm_trab}"),
            'nombre_trab'    => $t->nombre_trab,
            'apellp_trab'    => $t->apellp_trab,
            'apellm_trab'    => $t->apellm_trab,
            'delegacion'     => $t->delegacion,
            'ur'             => $t->ur,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/delegaciones?ur={key}   (o ?dependencia_clave={key})
     * Devuelve los códigos de delegación distintos para una UR.
     * Usado por EmpleadosPage para el segundo filtro en cascada.
     */
    public function codigos(Request $request): JsonResponse
    {
        // Acepta tanto "ur" como "dependencia_clave" para compatibilidad
        $ur = $request->get('ur') ?? $request->get('dependencia_clave');

        if (! $ur) {
            return response()->json(['data' => []]);
        }

        $rows = DB::table('delegacion')
            ->where('ur', (int) $ur)
            ->selectRaw('delegacion AS clave, COUNT(*) AS trabajadores_count')
            ->groupBy('delegacion')
            ->orderBy('delegacion')
            ->get();

        $data = $rows->map(fn ($r) => [
            'clave'              => $r->clave,
            'nombre'             => null,
            'trabajadores_count' => (int) $r->trabajadores_count,
        ]);

        return response()->json(['data' => $data]);
    }
}
