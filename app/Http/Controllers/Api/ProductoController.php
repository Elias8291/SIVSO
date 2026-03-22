<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search  = trim((string) $request->get('search', ''));
        $partida = $request->get('partida');
        $anio    = (int) ($request->get('anio', date('Y')));

        if ($request->boolean('all')) {
            $rows = DB::table('productos AS p')
                ->join('producto_precios AS pp', function ($j) use ($anio) {
                    $j->on('pp.producto_id', '=', 'p.id')->where('pp.anio', $anio);
                })
                ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
                ->select([
                    'p.id', 'p.descripcion', 'pp.clave AS codigo', 'pa.numero AS partida',
                    'p.unidad', 'p.medida', 'p.marca', 'pp.precio_unitario',
                ])
                ->when($partida, fn ($q) => $q->where('pa.numero', $partida))
                ->when($search, fn ($q) =>
                    $q->where(fn ($q2) =>
                        $q2->where('p.descripcion', 'like', "%{$search}%")
                           ->orWhere('pp.clave', 'like', "%{$search}%")
                    )
                )
                ->orderBy('p.descripcion')
                ->get()
                ->map(fn ($r) => [
                    'id'               => $r->id,
                    'descripcion'      => $r->descripcion,
                    'clave_vestuario'  => $r->codigo,
                    'codigo'           => $r->codigo,
                    'partida'          => $r->partida,
                    'unidad'           => $r->unidad,
                    'medida'           => $r->medida,
                    'marca'            => $r->marca,
                    'precio_unitario'  => $r->precio_unitario,
                    'activo'           => true,
                ]);

            return response()->json(['data' => $rows]);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        $query = DB::table('productos AS p')
            ->leftJoin('producto_precios AS pp', function ($j) use ($anio) {
                $j->on('pp.producto_id', '=', 'p.id')->where('pp.anio', $anio);
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->join('proveedores AS pv', 'pv.id', '=', 'p.proveedor_id')
            ->select([
                'p.id', 'p.lote', 'pa.numero AS partida',
                'p.descripcion', 'p.unidad', 'p.marca',
                'pp.precio_unitario', 'p.medida', 'pp.clave AS codigo',
                'pv.nombre AS proveedor', 'p.codigo AS codigo_producto',
            ])
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('p.descripcion', 'like', "%{$search}%")
                       ->orWhere('pp.clave', 'like', "%{$search}%")
                       ->orWhere('p.marca', 'like', "%{$search}%")
                       ->orWhere('pv.nombre', 'like', "%{$search}%")
                )
            )
            ->when($partida, fn ($q) => $q->where('pa.numero', $partida))
            ->orderBy('p.descripcion');

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(fn ($r) => [
            'id'               => $r->id,
            'clave_vestuario'  => $r->codigo ?? $r->codigo_producto,
            'codigo'           => $r->codigo ?? $r->codigo_producto,
            'descripcion'      => $r->descripcion ?? '',
            'marca'            => $r->marca,
            'unidad'           => $r->unidad,
            'medida'           => $r->medida,
            'partida'          => $r->partida,
            'lote'             => $r->lote,
            'precio_unitario'  => $r->precio_unitario,
            'proveedor'        => $r->proveedor,
            'proveedor_nombre' => $r->proveedor,
            'activo'           => true,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem() ?? 0,
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $p = Producto::with(['proveedor:id,nombre', 'partida:id,numero', 'precios'])->find($id);
        if (! $p) {
            return response()->json(['message' => 'No encontrado.'], 404);
        }
        return response()->json($p);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'descripcion'  => 'required|string',
            'marca'        => 'nullable|string|max:255',
            'unidad'       => 'nullable|string|max:50',
            'medida'       => 'nullable|string|max:10',
            'codigo'       => 'nullable|string|max:30',
            'lote'         => 'nullable|string',
            'proveedor_id' => 'required|integer|exists:proveedores,id',
            'partida_id'   => 'required|integer|exists:partidas,id',
        ]);

        $producto = Producto::create($data);

        return response()->json(['message' => 'Producto creado correctamente.', 'id' => $producto->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $p = Producto::find($id);
        if (! $p) {
            return response()->json(['message' => 'No encontrado.'], 404);
        }

        $data = $request->validate([
            'descripcion'  => 'required|string',
            'marca'        => 'nullable|string|max:255',
            'unidad'       => 'nullable|string|max:50',
            'medida'       => 'nullable|string|max:10',
            'codigo'       => 'nullable|string|max:30',
            'lote'         => 'nullable|string',
        ]);

        $p->update($data);

        return response()->json(['message' => 'Producto actualizado correctamente.']);
    }

    public function destroy(int $id): JsonResponse
    {
        Producto::where('id', $id)->delete();
        return response()->json(['message' => 'Producto eliminado correctamente.']);
    }

    public function toggle(int $id): JsonResponse
    {
        return response()->json(['message' => 'Los productos no tienen estado activo/inactivo.', 'activo' => true]);
    }
}
