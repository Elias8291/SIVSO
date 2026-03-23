<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\Seleccion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VestuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->nue) {
            return response()->json(['empleado' => null, 'asignaciones' => [], 'anio' => (int) date('Y'), 'anios_disponibles' => []]);
        }

        $empleado = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])
            ->where('nue', $user->nue)
            ->first();

        if (! $empleado) {
            return response()->json(['empleado' => null, 'asignaciones' => [], 'anio' => (int) date('Y'), 'anios_disponibles' => []]);
        }

        $aniosDisponibles = DB::table('selecciones')
            ->where('empleado_id', $empleado->id)
            ->distinct()
            ->pluck('anio')
            ->sort()
            ->values()
            ->toArray();

        $anio = $request->has('anio')
            ? (int) $request->get('anio')
            : (count($aniosDisponibles) ? max($aniosDisponibles) : (int) date('Y'));

        $empleadoData = [
            'nue'                => $empleado->nue,
            'nombre'             => $empleado->nombre_completo,
            'delegacion_clave'   => $empleado->delegacion?->clave,
            'dependencia_clave'  => $empleado->dependencia?->clave,
            'dependencia_nombre' => $empleado->dependencia?->nombre ?? '',
        ];

        $asignaciones = $this->getSelecciones($empleado->id, $anio);

        $periodoActivo = Periodo::where('estado', 'abierto')
            ->orderByDesc('anio')
            ->first();

        return response()->json([
            'empleado'          => $empleadoData,
            'asignaciones'      => $asignaciones,
            'anio'              => $anio,
            'anios_disponibles' => $aniosDisponibles,
            'periodo_activo'    => $periodoActivo ? [
                'id'        => $periodoActivo->id,
                'nombre'    => $periodoActivo->nombre,
                'fecha_fin' => $periodoActivo->fecha_fin ? $periodoActivo->fecha_fin->format('Y-m-d') : null,
            ] : null,
        ]);
    }

    private function verificarPeriodoActivo(int $anio): ?JsonResponse
    {
        $periodo = Periodo::where('estado', 'abierto')->first();

        if (! $periodo) {
            return response()->json(['message' => 'No hay un periodo de actualización activo. No se pueden hacer cambios.'], 403);
        }
        return null;
    }

    public function updateTalla(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado->id)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($blocked = $this->verificarPeriodoActivo($seleccion->anio)) {
            return $blocked;
        }

        $request->validate(['talla' => 'required|string|max:30']);

        $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
        if (! $talla) {
            $tallaId = DB::table('tallas')->insertGetId(['nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now()]);
        } else {
            $tallaId = $talla->id;
        }

        $newPt = DB::table('producto_tallas')
            ->where('producto_id', $seleccion->productoTalla->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $newPt) {
            $newPt = (object) ['id' => DB::table('producto_tallas')->insertGetId([
                'producto_id' => $seleccion->productoTalla->producto_id,
                'talla_id'    => $tallaId,
                'anio'        => $seleccion->anio,
                'medidas'     => null,
                'cantidad_disponible' => 0,
                'created_at'  => now(),
                'updated_at'  => now(),
            ])];
        }

        $seleccion->update(['producto_talla_id' => $newPt->id]);

        return response()->json(['message' => 'Talla actualizada correctamente.']);
    }

    public function updateProducto(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado->id)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($blocked = $this->verificarPeriodoActivo($seleccion->anio)) {
            return $blocked;
        }

        $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'talla'       => 'nullable|string|max:30',
        ]);

        $tallaId = $seleccion->productoTalla->talla_id;
        if ($request->talla) {
            $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
            $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
                'nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $pt = DB::table('producto_tallas')
            ->where('producto_id', $request->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $pt) {
            $ptId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $request->producto_id,
                'talla_id'    => $tallaId,
                'anio'        => $seleccion->anio,
                'medidas'     => null,
                'cantidad_disponible' => 0,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        } else {
            $ptId = $pt->id;
        }

        $seleccion->update(['producto_talla_id' => $ptId]);

        return response()->json(['message' => 'Artículo actualizado correctamente.']);
    }

    public function empleadoVestuario(Request $request, int $empleado): JsonResponse
    {
        $emp = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])->find($empleado);
        if (! $emp) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        $aniosDisponibles = DB::table('selecciones')
            ->where('empleado_id', $emp->id)
            ->distinct()
            ->pluck('anio')
            ->sort()
            ->values()
            ->toArray();

        $anio = $request->has('anio')
            ? (int) $request->get('anio')
            : (count($aniosDisponibles) ? max($aniosDisponibles) : (int) date('Y'));

        $empleadoData = [
            'nue'                => $emp->nue,
            'nombre'             => $emp->nombre_completo,
            'delegacion_clave'   => $emp->delegacion?->clave,
            'dependencia_clave'  => $emp->dependencia?->clave,
            'dependencia_nombre' => $emp->dependencia?->nombre ?? '',
        ];

        $asignaciones = $this->getSelecciones($emp->id, $anio);

        return response()->json([
            'empleado'          => $empleadoData,
            'asignaciones'      => $asignaciones,
            'anio'              => $anio,
            'anios_disponibles' => $aniosDisponibles,
        ]);
    }

    public function empleadoUpdateTalla(Request $request, int $empleado, int $id): JsonResponse
    {
        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $request->validate(['talla' => 'required|string|max:30']);

        $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
        $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
            'nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now(),
        ]);

        $newPt = DB::table('producto_tallas')
            ->where('producto_id', $seleccion->productoTalla->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $newPt) {
            $newPt = (object) ['id' => DB::table('producto_tallas')->insertGetId([
                'producto_id' => $seleccion->productoTalla->producto_id,
                'talla_id'    => $tallaId,
                'anio'        => $seleccion->anio,
                'medidas'     => null,
                'cantidad_disponible' => 0,
                'created_at'  => now(),
                'updated_at'  => now(),
            ])];
        }

        $seleccion->update(['producto_talla_id' => $newPt->id]);

        return response()->json(['message' => 'Talla actualizada correctamente.']);
    }

    public function empleadoUpdateProducto(Request $request, int $empleado, int $id): JsonResponse
    {
        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'talla'       => 'nullable|string|max:30',
        ]);

        $tallaId = $seleccion->productoTalla->talla_id;
        if ($request->talla) {
            $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
            $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
                'nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $pt = DB::table('producto_tallas')
            ->where('producto_id', $request->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $pt) {
            $ptId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $request->producto_id,
                'talla_id'    => $tallaId,
                'anio'        => $seleccion->anio,
                'medidas'     => null,
                'cantidad_disponible' => 0,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        } else {
            $ptId = $pt->id;
        }

        $seleccion->update(['producto_talla_id' => $ptId]);

        return response()->json(['message' => 'Artículo actualizado correctamente.']);
    }

    private function getSelecciones(int $empleadoId, int $anio): \Illuminate\Support\Collection
    {
        return DB::table('selecciones AS s')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->where('s.empleado_id', $empleadoId)
            ->where('s.anio', $anio)
            ->select([
                's.id', 's.cantidad', 's.anio',
                'p.id AS producto_id', 'p.descripcion', 'p.marca', 'p.unidad', 'p.medida',
                'pp.clave AS codigo', 'pp.precio_unitario',
                't.nombre AS talla', 't.id AS talla_id',
                'pa.numero AS partida',
            ])
            ->orderBy('pa.numero')
            ->orderBy('p.descripcion')
            ->get()
            ->map(fn ($c) => [
                'id'              => $c->id,
                'producto_id'     => $c->producto_id,
                'cantidad'        => (int) $c->cantidad,
                'talla'           => $c->talla,
                'talla_id'        => $c->talla_id,
                'clave_vestuario' => $c->codigo,
                'codigo'          => $c->codigo,
                'precio_unitario' => $c->precio_unitario,
                'importe'         => $c->precio_unitario ? round($c->cantidad * $c->precio_unitario, 2) : null,
                'descripcion'     => $c->descripcion,
                'marca'           => $c->marca,
                'unidad'          => $c->unidad,
                'medida'          => $c->medida,
                'partida'         => $c->partida,
            ]);
    }
}
