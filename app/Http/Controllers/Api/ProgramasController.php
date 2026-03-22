<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgramasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $nue    = trim((string) $request->get('nue', ''));
        $search = trim((string) $request->get('search', ''));
        $anio   = (int) ($request->get('anio', date('Y')));

        if (! $nue && ! $search) {
            return response()->json(['data' => []]);
        }

        $query = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->where('s.anio', $anio);

        if ($nue) {
            $query->where('e.nue', $nue);
        }

        if ($search) {
            $query->where(fn ($q2) =>
                $q2->where('p.descripcion', 'like', "%{$search}%")
                   ->orWhere('pp.clave', 'like', "%{$search}%")
            );
        }

        $rows = $query->select([
                's.id', 'e.nue', 'p.descripcion', 'pp.clave',
                'pa.numero AS partida', 's.cantidad', 't.nombre AS talla',
            ])
            ->orderBy('pa.numero')
            ->orderBy('p.descripcion')
            ->limit(200)
            ->get();

        $data = $rows->map(fn ($r) => [
            'id'          => $r->id,
            'clave'       => $r->clave ?? '-',
            'descripcion' => $r->descripcion ?? '',
            'partida'     => $r->partida,
            'cantidad'    => (int) $r->cantidad,
            'talla'       => $r->talla,
        ]);

        return response()->json(['data' => $data->values()->all()]);
    }
}
