<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GET /api/mi-delegacion
 * Delegaciones del usuario actual.
 * Prioridad: 1) delegado_id asignado en Mi Cuenta  2) NUE vinculado al padrón.
 */
class MiDelegacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $delegados = collect();

        $conn = 'bas_vestuario';

        // 1. Si tiene delegado asignado en Mi Cuenta, traer TODAS las delegaciones de ese delegado (mismo nombre)
        if ($user->delegado_id) {
            $d = DB::connection($conn)->table('delegado')->where('id', (int) $user->delegado_id)->first();
            if ($d) {
                $nombre = trim($d->nombre);
                $rows   = DB::connection($conn)->table('delegado')
                    ->whereRaw('TRIM(nombre) = ?', [$nombre])
                    ->orderBy('ur')
                    ->orderBy('delegacion')
                    ->get(['id', 'nombre', 'delegacion', 'ur']);
                // Sin duplicados por delegación (clave + UR)
                $seen = [];
                $delegados = $rows->filter(function ($r) use (&$seen) {
                    $k = $r->ur . '_' . str_replace('-', '', (string) $r->delegacion);
                    if (isset($seen[$k])) return false;
                    $seen[$k] = true;
                    return true;
                })->values();
            }
        }

        // 2. Si no hay delegado asignado, buscar por NUE
        if ($delegados->isEmpty() && $user->nue) {
            $trabajador = DB::connection($conn)->table('delegacion')
                ->where('nue', $user->nue)
                ->first(['delegacion', 'ur']);

            if ($trabajador) {
                $delCode = str_replace('-', '', $trabajador->delegacion);
                $delegados = DB::connection($conn)->table('delegado')
                    ->where('ur', $trabajador->ur)
                    ->whereRaw("REPLACE(delegacion, '-', '') = ?", [$delCode])
                    ->get(['id', 'nombre', 'delegacion', 'ur']);
            }
        }

        if ($delegados->isEmpty()) {
            $message = $user->delegado_id
                ? 'No se encontró el delegado asignado.'
                : ($user->nue
                    ? 'Tu NUE no tiene delegación asignada en el padrón.'
                    : 'Asigna un delegado en Mi Cuenta o vincula tu NUE para ver tus delegaciones.');

            return response()->json(['data' => [], 'message' => $message]);
        }

        $trabCounts = DB::connection($conn)->table('delegacion')
            ->selectRaw("ur, REPLACE(delegacion, '-', '') AS del_code, COUNT(*) AS cnt")
            ->groupByRaw("ur, REPLACE(delegacion, '-', '')")
            ->get()
            ->keyBy(fn ($r) => "{$r->ur}_{$r->del_code}");

        $data = $delegados->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->delegacion,
            'nombre'             => $d->nombre,
            'ur'                 => $d->ur,
            'trabajadores_count' => (int) ($trabCounts->get($d->ur . '_' . str_replace('-', '', (string) $d->delegacion))?->cnt ?? 0),
        ])->values()->all();

        return response()->json(['data' => $data]);
    }
}
