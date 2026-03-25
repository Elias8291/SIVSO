<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EmpleadoController extends Controller
{
    private function delegacionIdsQueGestionaElUsuario(Request $request): Collection
    {
        $user = $request->user();
        $delegado = Delegado::where('user_id', $user->id)->first();
        $ids = collect();
        if ($delegado) {
            $ids = DB::table('delegado_delegacion')
                ->where('delegado_id', $delegado->id)
                ->pluck('delegacion_id');
        }
        if ($ids->isEmpty()) {
            $emp = null;
            $nueTrim = trim((string) ($user->nue ?? ''));
            if ($nueTrim !== '') {
                $emp = Empleado::where('nue', $nueTrim)->first();
            }
            if (! $emp && $user instanceof User) {
                $emp = Empleado::where('user_id', $user->id)->first();
            }
            if (! $emp && $user instanceof User) {
                $del = Delegado::where('user_id', $user->id)->whereNotNull('empleado_id')->first();
                if ($del) {
                    $emp = Empleado::find($del->empleado_id);
                }
            }
            if ($emp && $emp->delegacion_id) {
                $ids = DB::table('delegado_delegacion AS dd')
                    ->where('dd.delegacion_id', $emp->delegacion_id)
                    ->pluck('dd.delegacion_id');
            }
        }

        return $ids->unique()->values();
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 20), 100);
        $search = trim((string) $request->get('search', ''));
        $depClave = $request->get('dependencia_clave');
        $delClave = $request->get('delegacion_clave');

        $user = $request->user();
        $puedeVerModuloEmpleados = $user->can('ver_empleados');
        $puedeMiDelegacion = $user->can('ver_mi_delegacion');

        if (! $puedeVerModuloEmpleados && $puedeMiDelegacion) {
            $delClaveTrim = trim((string) ($delClave ?? ''));
            if ($delClaveTrim === '') {
                return response()->json([
                    'message' => 'Debe indicar la clave de delegación (delegacion_clave).',
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0,
                        'from' => 0,
                        'to' => 0,
                    ],
                ], 422);
            }

            $ids = $this->delegacionIdsQueGestionaElUsuario($request);
            if ($ids->isEmpty()) {
                return response()->json(['message' => 'No tiene delegaciones asignadas para consultar colaboradores.'], 403);
            }

            $allowedClaves = DB::table('delegaciones')
                ->whereIn('id', $ids)
                ->pluck('clave')
                ->map(fn ($c) => trim((string) $c))
                ->all();

            if (! in_array($delClaveTrim, $allowedClaves, true)) {
                return response()->json(['message' => 'No tiene permiso para listar empleados de esta delegación.'], 403);
            }

            if ($depClave) {
                return response()->json([
                    'message' => 'No puede filtrar por dependencia en este listado.',
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0,
                        'from' => 0,
                        'to' => 0,
                    ],
                ], 403);
            }
        }

        $anioActual = Periodo::where('estado', 'abierto')->value('anio')
            ?? (DB::table('selecciones')->max('anio') ?? date('Y'));

        $query = Empleado::query()
            ->with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])
            ->withExists(['selecciones as actualizado' => function ($q) use ($anioActual) {
                $q->where('anio', $anioActual);
            }]);

        if ($depClave) {
            $query->whereHas('dependencia', fn ($q) => $q->where('clave', $depClave));
        }

        if ($delClave) {
            $query->whereHas('delegacion', fn ($q) => $q->where('clave', $delClave));
        }

        $query->when($search !== '', fn ($q) => $q->whereBusquedaEmpleado($search))
            ->orderByRaw('apellido_paterno, apellido_materno, nombre');

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(fn (Empleado $e) => [
            'id' => $e->id,
            'nue' => $e->nue,
            'nombre' => $e->nombre,
            'apellido_paterno' => $e->apellido_paterno,
            'apellido_materno' => $e->apellido_materno,
            'nombre_completo' => $e->nombre_completo,
            'dependencia_clave' => $e->dependencia?->clave,
            'dependencia_nombre' => $e->dependencia?->nombre,
            'delegacion_clave' => $e->delegacion?->clave,
            'delegacion_nombre' => null,
            'activa' => true,
            'user_id' => $e->user_id,
            'actualizado' => $e->actualizado,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem() ?? 0,
                'to' => $paginated->lastItem() ?? 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nue' => 'required|string|max:20',
            'nombre' => 'nullable|string|max:255',
            'apellido_paterno' => 'nullable|string|max:255',
            'apellido_materno' => 'nullable|string|max:255',
            'dependencia_clave' => 'required|string|exists:dependencias,clave',
            'delegacion_clave' => 'required|string|exists:delegaciones,clave',
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $depId = DB::table('dependencias')->where('clave', $data['dependencia_clave'])->value('id');
        $delId = DB::table('delegaciones')->where('clave', $data['delegacion_clave'])->value('id');

        if (! empty($data['user_id'])) {
            Empleado::where('user_id', $data['user_id'])->update(['user_id' => null]);
        }

        $empleado = Empleado::create([
            'nue' => $data['nue'],
            'nombre' => strtoupper(trim($data['nombre'] ?? '')),
            'apellido_paterno' => strtoupper(trim($data['apellido_paterno'] ?? '')),
            'apellido_materno' => strtoupper(trim($data['apellido_materno'] ?? '')),
            'dependencia_id' => $depId,
            'delegacion_id' => $delId,
            'user_id' => $data['user_id'] ?? null,
        ]);

        return response()->json(['message' => 'Trabajador creado correctamente.', 'id' => $empleado->id], 201);
    }

    public function show(int $empleado): JsonResponse
    {
        $e = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave', 'user:id,name,rfc,email'])
            ->find($empleado);
        if (! $e) {
            return response()->json(['message' => 'No encontrado.'], 404);
        }

        return response()->json([
            'id' => $e->id,
            'nue' => $e->nue,
            'nombre' => $e->nombre,
            'apellido_paterno' => $e->apellido_paterno,
            'apellido_materno' => $e->apellido_materno,
            'dependencia_clave' => $e->dependencia?->clave,
            'dependencia_nombre' => $e->dependencia?->nombre,
            'delegacion_clave' => $e->delegacion?->clave,
            'user_id' => $e->user_id,
            'usuario' => $e->user ? [
                'id' => $e->user->id,
                'name' => $e->user->name,
                'rfc' => $e->user->rfc,
                'email' => $e->user->email,
            ] : null,
        ]);
    }

    /**
     * Crea un usuario (RFC, contraseña, etc.) y lo vincula a este empleado con rol empleado.
     */
    public function crearUsuario(Request $request, int $empleado): JsonResponse
    {
        $e = Empleado::find($empleado);
        if (! $e) {
            return response()->json(['message' => 'Trabajador no encontrado.'], 404);
        }

        if ($e->user_id) {
            return response()->json(['message' => 'Este empleado ya tiene un usuario vinculado.'], 422);
        }

        $data = $request->validate([
            'rfc' => ['required', 'string', 'max:20', 'unique:users,rfc'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => 'required|string|min:8|confirmed',
            'name' => 'nullable|string|max:255',
        ]);

        $nombreCompleto = trim(implode(' ', array_filter([
            $e->nombre,
            $e->apellido_paterno,
            $e->apellido_materno,
        ])));

        $name = ! empty($data['name'])
            ? trim($data['name'])
            : ($nombreCompleto !== '' ? $nombreCompleto : 'Usuario');

        $user = User::create([
            'name' => $name,
            'rfc' => strtoupper(trim($data['rfc'])),
            'email' => $data['email'] ?? null,
            'password' => $data['password'],
            'nue' => $e->nue,
            'activo' => true,
        ]);

        $user->assignRole('empleado');

        Empleado::where('user_id', $user->id)->where('id', '!=', $e->id)->update(['user_id' => null]);

        $e->user_id = $user->id;
        $e->save();

        return response()->json([
            'message' => 'Usuario creado y vinculado correctamente.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'rfc' => $user->rfc,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function update(Request $request, int $empleado): JsonResponse
    {
        $e = Empleado::find($empleado);
        if (! $e) {
            return response()->json(['message' => 'Trabajador no encontrado.'], 404);
        }

        $data = $request->validate([
            'nue' => 'required|string|max:20',
            'nombre' => 'nullable|string|max:255',
            'apellido_paterno' => 'nullable|string|max:255',
            'apellido_materno' => 'nullable|string|max:255',
            'dependencia_clave' => 'required|string|exists:dependencias,clave',
            'delegacion_clave' => 'required|string|exists:delegaciones,clave',
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $depId = DB::table('dependencias')->where('clave', $data['dependencia_clave'])->value('id');
        $delId = DB::table('delegaciones')->where('clave', $data['delegacion_clave'])->value('id');

        if (! empty($data['user_id'])) {
            Empleado::where('user_id', $data['user_id'])->where('id', '!=', $e->id)->update(['user_id' => null]);
        }

        $e->update([
            'nue' => $data['nue'],
            'nombre' => strtoupper(trim($data['nombre'] ?? '')),
            'apellido_paterno' => strtoupper(trim($data['apellido_paterno'] ?? '')),
            'apellido_materno' => strtoupper(trim($data['apellido_materno'] ?? '')),
            'dependencia_id' => $depId,
            'delegacion_id' => $delId,
            'user_id' => $data['user_id'] ?? null,
        ]);

        return response()->json(['message' => 'Trabajador actualizado correctamente.']);
    }

    public function destroy(int $empleado): JsonResponse
    {
        Empleado::where('id', $empleado)->delete();

        return response()->json(['message' => 'Trabajador eliminado correctamente.']);
    }

    public function toggle(int $empleado): JsonResponse
    {
        return response()->json(['message' => 'Los trabajadores no tienen estado activo/inactivo.']);
    }
}
