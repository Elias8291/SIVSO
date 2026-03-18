<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Panel 4 de Organización: Programas/partidas de vestuario del trabajador (concentrado).
 * GET /api/programas?nue={nue}
 */
class ProgramasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $nue    = trim((string) $request->get('nue', ''));
        $search = trim((string) $request->get('search', ''));

        // Sin nue ni search: no devolver todo el concentrado
        if (!$nue && !$search) {
            return response()->json(['data' => []]);
        }

        $query = DB::connection('bas_vestuario')->table('concentrado');

        if ($nue) {
            $query->where('nue', $nue);
        }

        if ($search) {
            $query->where(fn ($q2) =>
                $q2->where('descripcion', 'like', "%{$search}%")
                   ->orWhere('partida_descripcion', 'like', "%{$search}%")
                   ->orWhere('clave_partida', 'like', "%{$search}%")
                   ->orWhere('clave_descripcion', 'like', "%{$search}%")
            );
        }

        $rows = $query->orderBy('partida_descripcion')
            ->orderBy('descripcion')
            ->limit(200)
            ->get([
                'id', 'nue', 'descripcion', 'partida_descripcion',
                'clave_partida', 'clave_descripcion', 'cantidad', 'talla',
                'no_partida', 'clave2025',
            ]);

        $data = $rows->map(fn ($r) => [
            'id'                 => $r->id,
            'clave'              => $r->clave_partida ?? $r->clave2025 ?? '-',
            'descripcion'        => trim($r->descripcion ?? $r->partida_descripcion ?? ''),
            'partida'            => trim($r->partida_descripcion ?? ''),
            'cantidad'           => (int) ($r->cantidad ?? 0),
            'talla'              => $r->talla,
        ]);

        return response()->json(['data' => $data->values()->all()]);
    }
}
