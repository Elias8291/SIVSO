<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabla principal: concentrado
 * Contiene los registros de vestuario asignado por trabajador (por NUE).
 *
 * Campos clave de concentrado:
 *   nue               → identificador del trabajador
 *   ur                → unidad receptora (= dependences.key)
 *   no_partida        → número de partida (= propuesta.partida)
 *   clave2025         → clave/código del artículo (= propuesta.codigo aproximado)
 *   descripcion       → descripción del artículo en concentrado
 *   cantidad, talla, precio_unitario, importe, iva, total
 *
 * Relación con propuesta:
 *   concentrado.no_partida = propuesta.partida  (puede ser 1:N)
 *   Para un match más preciso: también comparar clave2025 ≈ propuesta.codigo
 */
class VestuarioController extends Controller
{
    /** GET /api/mi-vestuario — artículos del trabajador autenticado */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // El usuario debe tener NUE vinculado
        if (! $user->nue) {
            return response()->json([
                'empleado'     => null,
                'asignaciones' => [],
                'anio'         => date('Y'),
            ]);
        }

        // Buscar al trabajador en delegacion
        $trabajador = DB::table('delegacion')
            ->where('nue', $user->nue)
            ->first(['id', 'nue', 'nombre_trab', 'apellp_trab', 'apellm_trab', 'delegacion', 'ur']);

        if (! $trabajador) {
            return response()->json([
                'empleado'     => null,
                'asignaciones' => [],
                'anio'         => date('Y'),
            ]);
        }

        // Nombre de la dependencia
        $dep = DB::table('dependences')->where('key', $trabajador->ur)->first();

        $empleado = [
            'nue'                => $trabajador->nue,
            'nombre'             => trim("{$trabajador->nombre_trab} {$trabajador->apellp_trab} {$trabajador->apellm_trab}"),
            'delegacion_clave'   => $trabajador->delegacion,
            'dependencia_clave'  => (string) $trabajador->ur,
            'dependencia_nombre' => $dep?->name ?? '',
        ];

        // Obtener todos los registros de concentrado para este NUE
        $concentrados = DB::table('concentrado AS c')
            ->where('c.nue', $user->nue)
            ->leftJoin(
                DB::raw('(SELECT partida, MIN(id) as pid FROM propuesta GROUP BY partida) AS pp_min'),
                'pp_min.partida', '=', 'c.no_partida'
            )
            ->leftJoin('propuesta AS pp', 'pp.id', '=', 'pp_min.pid')
            ->select([
                'c.id',
                'c.nue',
                'c.ur',
                'c.no_partida',
                'c.clave2025',
                'c.descripcion',
                'c.clave_descripcion',
                'c.cantidad',
                'c.talla',
                'c.precio_unitario',
                'c.importe',
                'c.iva',
                'c.total',
                'pp.id      AS propuesta_id',
                'pp.marca   AS marca',
                'pp.unidad  AS unidad',
                'pp.medida  AS medida',
                'pp.codigo  AS codigo_propuesta',
            ])
            ->orderBy('c.no_partida')
            ->orderBy('c.descripcion')
            ->get();

        // Año derivado: si clave2025 tiene datos asumir 2025, sino año actual
        $anio = $concentrados->isNotEmpty() ? 2025 : (int) date('Y');

        $asignaciones = $concentrados->map(fn ($c) => [
            'id'              => $c->id,
            'producto_id'     => $c->propuesta_id ?? $c->id,
            'cantidad'        => (int) ($c->cantidad ?? 1),
            'talla'           => $c->talla,
            'clave_variante'  => $c->clave2025,
            'precio_unitario' => $c->precio_unitario,
            'importe'         => $c->importe,
            'descripcion'     => $c->descripcion
                                    ?? $c->clave_descripcion
                                    ?? "Partida {$c->no_partida}",
            'clave_vestuario' => $c->clave2025 ?? $c->codigo_propuesta,
            'codigo'          => $c->clave2025,
            'marca'           => $c->marca,
            'unidad'          => $c->unidad,
            'medida'          => $c->medida,
            'partida'         => $c->no_partida,
        ]);

        return response()->json([
            'empleado'     => $empleado,
            'asignaciones' => $asignaciones,
            'anio'         => $anio,
        ]);
    }

    /** PUT /api/mi-vestuario/{id}/talla — actualizar talla del registro en concentrado */
    public function updateTalla(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $registro = DB::table('concentrado')
            ->where('id', $id)
            ->where('nue', $user->nue)
            ->first();

        if (! $registro) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $request->validate(['talla' => 'required|string|max:10']);

        DB::table('concentrado')
            ->where('id', $id)
            ->update(['talla' => strtoupper(trim($request->talla))]);

        return response()->json(['message' => 'Talla actualizada correctamente.']);
    }

    /**
     * PUT /api/mi-vestuario/{id}/producto
     * Cambiar el artículo de un registro de concentrado.
     * Se recibe el id de un registro de propuesta y se actualizan los campos del concentrado.
     */
    public function updateProducto(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $registro = DB::table('concentrado')
            ->where('id', $id)
            ->where('nue', $user->nue)
            ->first();

        if (! $registro) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $request->validate([
            'producto_id' => 'required|integer|exists:propuesta,id',
            'talla'       => 'nullable|string|max:10',
        ]);

        $propuesta = DB::table('propuesta')->where('id', $request->producto_id)->first();

        $cantidad = (int) ($registro->cantidad ?? 1);
        $precio   = $propuesta->precio_unitario ?? $registro->precio_unitario;
        $importe  = $precio ? round($cantidad * $precio, 2) : $registro->importe;

        DB::table('concentrado')->where('id', $id)->update([
            'descripcion'     => $propuesta->descripcion,
            'clave2025'       => $propuesta->codigo,
            'precio_unitario' => $precio,
            'importe'         => $importe,
            'total'           => $importe,
            'no_partida'      => $propuesta->partida,
            'talla'           => $request->talla
                ? strtoupper(trim($request->talla))
                : $registro->talla,
        ]);

        return response()->json(['message' => 'Artículo actualizado correctamente.']);
    }
}
