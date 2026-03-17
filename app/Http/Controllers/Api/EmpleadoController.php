<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Tabla: delegacion (id, nombre_trab, apellp_trab, apellm_trab, nue, ur, dependencia, delegacion)
 * Los "empleados" del sistema de vestuario son los trabajadores de esta tabla.
 *
 * Mapeo de campos (frontend → tabla):
 *   nombre           → nombre_trab
 *   apellido_paterno → apellp_trab
 *   apellido_materno → apellm_trab
 *   dependencia_clave→ ur  (int, = key de dependences)
 *   delegacion_clave → delegacion (varchar, ej: "3B-101")
 */
class EmpleadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage  = min((int) $request->get('per_page', 20), 100);
        $search   = trim((string) $request->get('search', ''));
        $depClave = $request->get('dependencia_clave'); // ur
        $delClave = $request->get('delegacion_clave');  // delegacion code

        $query = DB::table('delegacion AS e')
            ->leftJoin('dependences AS dep', 'dep.key', '=', DB::raw('CAST(e.ur AS CHAR)'))
            ->select([
                'e.id',
                'e.nue',
                'e.nombre_trab',
                'e.apellp_trab',
                'e.apellm_trab',
                'e.ur',
                'e.delegacion',
                'dep.name AS dependencia_nombre',
            ])
            ->when($depClave, fn ($q) => $q->where('e.ur', (int) $depClave))
            ->when($delClave, fn ($q) => $q->where('e.delegacion', $delClave))
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('e.nue',          'like', "%{$search}%")
                       ->orWhere('e.nombre_trab', 'like', "%{$search}%")
                       ->orWhere('e.apellp_trab', 'like', "%{$search}%")
                       ->orWhere('e.apellm_trab', 'like', "%{$search}%")
                )
            )
            ->orderByRaw('e.apellp_trab, e.apellm_trab, e.nombre_trab');

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(fn ($e) => [
            'id'                  => $e->id,
            'nue'                 => $e->nue,
            'nombre'              => $e->nombre_trab,
            'apellido_paterno'    => $e->apellp_trab,
            'apellido_materno'    => $e->apellm_trab,
            'nombre_completo'     => trim("{$e->apellp_trab} {$e->apellm_trab} {$e->nombre_trab}"),
            'dependencia_clave'   => (string) $e->ur,
            'dependencia_nombre'  => $e->dependencia_nombre,
            'delegacion_clave'    => $e->delegacion,
            'delegacion_nombre'   => null,
            'activa'              => true,
            'user_id'             => null,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem()  ?? 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nue'                => 'required|string|max:15',
            'nombre'             => 'nullable|string|max:80',
            'apellido_paterno'   => 'nullable|string|max:80',
            'apellido_materno'   => 'nullable|string|max:80',
            'dependencia_clave'  => 'required|integer',
            'delegacion_clave'   => 'required|string|max:30',
        ]);

        $exists = DB::table('delegacion')
            ->where('nue', $data['nue'])
            ->where('delegacion', $data['delegacion_clave'])
            ->exists();

        if ($exists) {
            return response()->json(['errors' => ['nue' => ['Este NUE ya existe en esa delegación.']]], 422);
        }

        $id = DB::table('delegacion')->insertGetId([
            'nue'         => $data['nue'],
            'nombre_trab' => strtoupper(trim($data['nombre'] ?? '')),
            'apellp_trab' => strtoupper(trim($data['apellido_paterno'] ?? '')),
            'apellm_trab' => strtoupper(trim($data['apellido_materno'] ?? '')),
            'ur'          => (int) $data['dependencia_clave'],
            'delegacion'  => strtoupper(trim($data['delegacion_clave'])),
            'dependencia' => '',
        ]);

        return response()->json(['message' => 'Trabajador creado correctamente.', 'id' => $id], 201);
    }

    public function update(Request $request, int $empleado): JsonResponse
    {
        $row = DB::table('delegacion')->where('id', $empleado)->first();
        if (! $row) {
            return response()->json(['message' => 'Trabajador no encontrado.'], 404);
        }

        $data = $request->validate([
            'nue'                => 'required|string|max:15',
            'nombre'             => 'nullable|string|max:80',
            'apellido_paterno'   => 'nullable|string|max:80',
            'apellido_materno'   => 'nullable|string|max:80',
            'dependencia_clave'  => 'required|integer',
            'delegacion_clave'   => 'required|string|max:30',
        ]);

        $exists = DB::table('delegacion')
            ->where('nue', $data['nue'])
            ->where('delegacion', $data['delegacion_clave'])
            ->where('id', '!=', $empleado)
            ->exists();

        if ($exists) {
            return response()->json(['errors' => ['nue' => ['Este NUE ya existe en esa delegación.']]], 422);
        }

        DB::table('delegacion')->where('id', $empleado)->update([
            'nue'         => $data['nue'],
            'nombre_trab' => strtoupper(trim($data['nombre'] ?? '')),
            'apellp_trab' => strtoupper(trim($data['apellido_paterno'] ?? '')),
            'apellm_trab' => strtoupper(trim($data['apellido_materno'] ?? '')),
            'ur'          => (int) $data['dependencia_clave'],
            'delegacion'  => strtoupper(trim($data['delegacion_clave'])),
        ]);

        return response()->json(['message' => 'Trabajador actualizado correctamente.']);
    }

    public function destroy(int $empleado): JsonResponse
    {
        DB::table('delegacion')->where('id', $empleado)->delete();
        return response()->json(['message' => 'Trabajador eliminado correctamente.']);
    }

    public function show(int $empleado): JsonResponse
    {
        $e = DB::table('delegacion')->where('id', $empleado)->first();
        if (! $e) return response()->json(['message' => 'No encontrado.'], 404);
        return response()->json($e);
    }

    /** PATCH .../toggle — no aplica (sin campo activo), retorna ok para compatibilidad */
    public function toggle(int $empleado): JsonResponse
    {
        return response()->json(['message' => 'Los trabajadores no tienen estado activo/inactivo.']);
    }
}
