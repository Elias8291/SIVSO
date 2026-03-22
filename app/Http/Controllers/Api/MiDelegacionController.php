<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MiDelegacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $delegaciones = collect();

        $delegado = Delegado::where('user_id', $user->id)->first();

        if ($delegado) {
            $delegaciones = DB::table('delegado_delegacion AS dd')
                ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                ->whereRaw('TRIM(d.nombre) = ?', [trim($delegado->nombre)])
                ->select(['dd.delegado_id', 'd.nombre', 'dl.id AS delegacion_id', 'dl.clave'])
                ->orderBy('dl.clave')
                ->get();
        }

        if ($delegaciones->isEmpty() && $user->nue) {
            $empleado = Empleado::where('nue', $user->nue)->first();
            if ($empleado && $empleado->delegacion_id) {
                $delegaciones = DB::table('delegado_delegacion AS dd')
                    ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                    ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                    ->where('dd.delegacion_id', $empleado->delegacion_id)
                    ->select(['dd.delegado_id', 'd.nombre', 'dl.id AS delegacion_id', 'dl.clave'])
                    ->get();
            }
        }

        if ($delegaciones->isEmpty()) {
            $message = $delegado
                ? 'No se encontraron delegaciones para este delegado.'
                : ($user->nue
                    ? 'Tu NUE no tiene delegación asignada en el padrón.'
                    : 'Asigna un delegado en Mi Cuenta o vincula tu NUE.');

            return response()->json(['data' => [], 'message' => $message]);
        }

        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegaciones->pluck('delegacion_id')->unique())
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $data = $delegaciones->map(fn ($d) => [
            'id'                 => $d->delegado_id,
            'clave'              => $d->clave,
            'nombre'             => $d->nombre,
            'trabajadores_count' => (int) ($trabCounts[$d->delegacion_id] ?? 0),
        ])->values()->all();

        return response()->json(['data' => $data]);
    }
}
