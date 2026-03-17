<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabla: propuesta
 * Catálogo de artículos de vestuario.
 * propuesta.codigo ↔ clave_vestuario en el frontend
 * No existe campo "activo" → siempre se devuelve activo: true
 */
class ProductoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search  = trim((string) $request->get('search', ''));
        $partida = $request->get('partida');

        // ?all=1 → lista completa para el modal "Cambiar artículo" en Mi Vestuario
        if ($request->boolean('all')) {
            $rows = DB::table('propuesta')
                ->select(['id', 'descripcion', 'codigo', 'partida', 'unidad', 'medida', 'marca', 'precio_unitario'])
                ->when($search, fn ($q) =>
                    $q->where(fn ($q2) =>
                        $q2->where('descripcion', 'like', "%{$search}%")
                           ->orWhere('codigo',     'like', "%{$search}%")
                    )
                )
                ->orderBy('descripcion')
                ->get()
                ->map(fn ($r) => [
                    'id'              => $r->id,
                    'descripcion'     => $r->descripcion,
                    'clave_vestuario' => $r->codigo,
                    'codigo'          => $r->codigo,
                    'partida'         => $r->partida,
                    'unidad'          => $r->unidad,
                    'medida'          => $r->medida,
                    'marca'           => $r->marca,
                    'precio_unitario' => $r->precio_unitario,
                    'activo'          => true,
                ]);
            return response()->json(['data' => $rows]);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        $query = DB::table('propuesta AS p')
            ->leftJoin('proveedor AS pv', 'pv.abreviacion', '=', 'p.proveedor')
            ->select([
                'p.id', 'p.lote', 'p.partida_especifica', 'p.partida',
                'p.descripcion', 'p.cantidad', 'p.unidad', 'p.marca',
                'p.precio_unitario', 'p.medida', 'p.codigo', 'p.proveedor',
                'pv.proveedor AS proveedor_nombre',
            ])
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('p.descripcion', 'like', "%{$search}%")
                       ->orWhere('p.codigo',     'like', "%{$search}%")
                       ->orWhere('p.marca',      'like', "%{$search}%")
                       ->orWhere('p.proveedor',  'like', "%{$search}%")
                )
            )
            ->when($partida, fn ($q) => $q->where('p.partida', $partida))
            ->orderBy('p.descripcion');

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(fn ($r) => [
            'id'                => $r->id,
            'clave_vestuario'   => $r->codigo,
            'codigo'            => $r->codigo,
            'descripcion'       => $r->descripcion,
            'marca'             => $r->marca,
            'unidad'            => $r->unidad,
            'medida'            => $r->medida,
            'partida'           => $r->partida,
            'partida_especifica'=> $r->partida_especifica,
            'lote'              => $r->lote,
            'precio_unitario'   => $r->precio_unitario,
            'proveedor'         => $r->proveedor,
            'proveedor_nombre'  => $r->proveedor_nombre,
            'activo'            => true,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem()  ?? 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'partida'           => 'required|integer',
            'partida_especifica'=> 'required|integer',
            'lote'              => 'nullable|integer',
            'codigo'            => 'nullable|string|max:30',
            'clave_vestuario'   => 'nullable|string|max:30',
            'descripcion'       => 'required|string',
            'marca'             => 'nullable|string|max:30',
            'unidad'            => 'nullable|string|max:15',
            'medida'            => 'nullable|string|max:5',
            'proveedor'         => 'nullable|string|max:30',
        ]);

        $id = DB::table('propuesta')->insertGetId([
            'lote'               => $data['lote'] ?? 0,
            'partida_especifica' => $data['partida_especifica'],
            'partida'            => $data['partida'],
            'descripcion'        => $data['descripcion'],
            'cantidad'           => 0,
            'unidad'             => $data['unidad'] ?? '',
            'marca'              => $data['marca'] ?? '',
            'precio_unitario'    => 0,
            'subtotal'           => 0,
            'proveedor'          => $data['proveedor'] ?? '',
            'medida'             => $data['medida'] ?? '',
            'codigo'             => $data['codigo'] ?? $data['clave_vestuario'] ?? '',
        ]);

        return response()->json(['message' => 'Producto creado correctamente.', 'id' => $id], 201);
    }

    public function show(int $id): JsonResponse
    {
        $p = DB::table('propuesta')->where('id', $id)->first();
        if (! $p) return response()->json(['message' => 'No encontrado.'], 404);
        return response()->json($p);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $p = DB::table('propuesta')->where('id', $id)->first();
        if (! $p) return response()->json(['message' => 'No encontrado.'], 404);

        $data = $request->validate([
            'partida'           => 'required|integer',
            'partida_especifica'=> 'required|integer',
            'lote'              => 'nullable|integer',
            'codigo'            => 'nullable|string|max:30',
            'clave_vestuario'   => 'nullable|string|max:30',
            'descripcion'       => 'required|string',
            'marca'             => 'nullable|string|max:30',
            'unidad'            => 'nullable|string|max:15',
            'medida'            => 'nullable|string|max:5',
        ]);

        DB::table('propuesta')->where('id', $id)->update([
            'lote'               => $data['lote'] ?? 0,
            'partida_especifica' => $data['partida_especifica'],
            'partida'            => $data['partida'],
            'descripcion'        => $data['descripcion'],
            'unidad'             => $data['unidad'] ?? '',
            'marca'              => $data['marca'] ?? '',
            'medida'             => $data['medida'] ?? '',
            'codigo'             => $data['codigo'] ?? $data['clave_vestuario'] ?? '',
        ]);

        return response()->json(['message' => 'Producto actualizado correctamente.']);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::table('propuesta')->where('id', $id)->delete();
        return response()->json(['message' => 'Producto eliminado correctamente.']);
    }

    /** No hay campo activo en propuesta — retorna ok sin cambios */
    public function toggle(int $id): JsonResponse
    {
        return response()->json(['message' => 'Los productos del catálogo no tienen estado activo/inactivo.', 'activo' => true]);
    }
}
