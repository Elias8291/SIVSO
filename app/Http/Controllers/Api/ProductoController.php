<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    /** Años con precio o tallas en catálogo (para filtros en UI). */
    private function aniosCatalogoDisponibles(): array
    {
        $aniosPrecio = DB::table('producto_precios')->distinct()->pluck('anio')->map(fn ($y) => (int) $y);
        $aniosTalla  = DB::table('producto_tallas')->distinct()->pluck('anio')->map(fn ($y) => (int) $y);
        $actual      = (int) date('Y');

        return $aniosPrecio->merge($aniosTalla)->push($actual)->unique()->sortDesc()->values()->all();
    }

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
                'total'         => $paginated->total(),
                'per_page'      => $paginated->perPage(),
                'current_page'  => $paginated->currentPage(),
                'last_page'     => $paginated->lastPage(),
                'from'          => $paginated->firstItem() ?? 0,
                'to'            => $paginated->lastItem() ?? 0,
                'anios_precios' => $this->aniosCatalogoDisponibles(),
                'anio_consulta' => $anio,
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $p = Producto::with(['proveedor:id,nombre', 'partida:id,numero', 'precios'])->find($id);
        if (! $p) {
            return response()->json(['message' => 'No encontrado.'], 404);
        }

        $anio = (int) ($request->get('anio', date('Y')));
        $precioEj = $p->precios->first(fn ($pr) => (int) $pr->anio === $anio);

        $tallasEjercicio = DB::table('producto_tallas AS pt')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->where('pt.producto_id', $id)
            ->where('pt.anio', $anio)
            ->orderBy('t.nombre')
            ->get(['pt.id', 'pt.talla_id', 't.nombre AS talla', 'pt.cantidad_disponible', 'pt.medidas'])
            ->map(fn ($r) => [
                'id'                   => $r->id,
                'talla_id'             => $r->talla_id,
                'talla'                => $r->talla,
                'cantidad_disponible'  => (int) $r->cantidad_disponible,
                'medidas'              => $r->medidas,
            ])
            ->values();

        $aniosConPrecio = $p->precios->pluck('anio')->map(fn ($y) => (int) $y)->unique()->sortDesc()->values()->all();
        $aniosTallas    = DB::table('producto_tallas')->where('producto_id', $id)->distinct()->pluck('anio')->map(fn ($y) => (int) $y)->all();
        $aniosSelector  = collect($aniosConPrecio)->merge($aniosTallas)->push((int) date('Y'))->unique()->sortDesc()->values()->all();

        $out = $p->toArray();
        $out['anio_catalogo'] = $anio;
        $out['catalogo_ejercicio'] = [
            'anio'             => $anio,
            'clave'            => $precioEj ? $precioEj->clave : $p->codigo,
            'precio_unitario'  => $precioEj ? (float) $precioEj->precio_unitario : null,
            'tallas'           => $tallasEjercicio,
        ];
        $out['anios_selector'] = $aniosSelector;

        return response()->json($out);
    }

    public function upsertPrecioEjercicio(Request $request, int $id): JsonResponse
    {
        Producto::findOrFail($id);

        $data = $request->validate([
            'anio'            => 'required|integer|min:2000|max:2100',
            'clave'           => 'required|string|max:30',
            'precio_unitario' => 'required|numeric|min:0',
        ]);

        $now     = now();
        $payload = [
            'clave'             => strtoupper(trim($data['clave'])),
            'precio_unitario'   => $data['precio_unitario'],
            'updated_at'        => $now,
        ];

        $exists = DB::table('producto_precios')
            ->where('producto_id', $id)
            ->where('anio', $data['anio'])
            ->exists();

        if ($exists) {
            DB::table('producto_precios')
                ->where('producto_id', $id)
                ->where('anio', $data['anio'])
                ->update($payload);
        } else {
            DB::table('producto_precios')->insert(array_merge($payload, [
                'producto_id' => $id,
                'anio'        => $data['anio'],
                'created_at'  => $now,
            ]));
        }

        return response()->json(['message' => 'Precio del ejercicio guardado correctamente.']);
    }

    public function agregarTallaEjercicio(Request $request, int $id): JsonResponse
    {
        Producto::findOrFail($id);

        $data = $request->validate([
            'anio'  => 'required|integer|min:2000|max:2100',
            'talla' => 'required|string|max:30',
        ]);

        $nombre = strtoupper(trim($data['talla']));
        $tallaId = DB::table('tallas')->where('nombre', $nombre)->value('id');
        if (! $tallaId) {
            $tallaId = DB::table('tallas')->insertGetId([
                'nombre'     => $nombre,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $dup = DB::table('producto_tallas')
            ->where('producto_id', $id)
            ->where('talla_id', $tallaId)
            ->where('anio', $data['anio'])
            ->exists();

        if ($dup) {
            return response()->json(['message' => 'Esa talla ya existe para este producto en el ejercicio indicado.'], 422);
        }

        $ptId = DB::table('producto_tallas')->insertGetId([
            'producto_id'         => $id,
            'talla_id'            => $tallaId,
            'anio'                => $data['anio'],
            'medidas'             => null,
            'cantidad_disponible' => 0,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        return response()->json(['message' => 'Talla agregada al ejercicio.', 'id' => $ptId], 201);
    }

    public function quitarTallaEjercicio(int $id, int $productoTalla): JsonResponse
    {
        Producto::findOrFail($id);

        $pt = DB::table('producto_tallas')
            ->where('id', $productoTalla)
            ->where('producto_id', $id)
            ->first();

        if (! $pt) {
            return response()->json(['message' => 'Registro de talla no encontrado.'], 404);
        }

        if (DB::table('selecciones')->where('producto_talla_id', $productoTalla)->exists()) {
            return response()->json(['message' => 'No se puede eliminar: hay selecciones de vestuario que usan esta talla.'], 422);
        }

        DB::table('producto_tallas')->where('id', $productoTalla)->delete();

        return response()->json(['message' => 'Talla eliminada del ejercicio.']);
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
