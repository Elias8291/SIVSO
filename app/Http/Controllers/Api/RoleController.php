<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Lista completa para dropdowns (modal de usuarios)
        if ($request->boolean('all')) {
            return response()->json([
                'data' => Role::orderBy('name')->get(['id', 'name', 'guard_name']),
            ]);
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $search  = trim((string) $request->get('search', ''));

        $query = Role::select('id', 'name', 'guard_name')->orderBy('name');

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('guard_name')) {
            $query->where('guard_name', $request->get('guard_name'));
        }

        $paginated = $query->paginate($perPage);
        $roleIds   = $paginated->pluck('id');

        // 1 query para conteo de permisos por rol
        $permisosCounts = \DB::table('role_has_permissions')
            ->whereIn('role_id', $roleIds)
            ->selectRaw('role_id, COUNT(*) as cnt')
            ->groupBy('role_id')
            ->pluck('cnt', 'role_id');

        // 1 query para conteo de usuarios por rol
        $userCounts = \DB::table('model_has_roles')
            ->whereIn('role_id', $roleIds)
            ->selectRaw('role_id, COUNT(*) as cnt')
            ->groupBy('role_id')
            ->pluck('cnt', 'role_id');

        // 1 query para IDs de permisos de cada rol
        $permissionsMap = \DB::table('role_has_permissions')
            ->whereIn('role_id', $roleIds)
            ->get(['role_id', 'permission_id'])
            ->groupBy('role_id');

        $data = $paginated->map(fn ($r) => [
            'id'             => $r->id,
            'name'           => $r->name,
            'guard_name'     => $r->guard_name,
            'permissions'    => $permissionsMap->get($r->id, collect())->pluck('permission_id'),
            'permisos_count' => $permisosCounts->get($r->id, 0),
            'users_count'    => $userCounts->get($r->id, 0),
        ])->values();

        // Todos los permisos (para el modal de rol) — carga una sola vez junto a la primera página
        $allPermisos = Permission::orderBy('name')->get(['id', 'name', 'guard_name']);

        return response()->json([
            'data'     => $data,
            'permisos' => $allPermisos,
            'meta'     => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem() ?? 0,
            ],
        ]);
    }

    public function show(Role $role): JsonResponse
    {
        $permissions = $role->permissions->pluck('id')->values()->all();
        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'guard_name'  => $role->guard_name,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255|unique:roles,name',
            'guard_name'    => 'nullable|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $role = Role::create([
            'name'       => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);

        $this->syncPermisos($role->id, $data['permissions'] ?? []);

        return response()->json(['message' => 'Rol creado correctamente.', 'id' => $role->id], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
            'guard_name'    => 'nullable|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $role->name       = $data['name'];
        $role->guard_name = $data['guard_name'] ?? $role->guard_name;
        $role->save();

        $this->syncPermisos($role->id, $data['permissions'] ?? []);

        return response()->json(['message' => 'Rol actualizado correctamente.']);
    }

    public function destroy(Role $role): JsonResponse
    {
        \DB::table('role_has_permissions')->where('role_id', $role->id)->delete();
        \DB::table('model_has_roles')->where('role_id', $role->id)->delete();
        $role->delete();

        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }

    private function syncPermisos(int $roleId, array $permissionIds): void
    {
        \DB::table('role_has_permissions')->where('role_id', $roleId)->delete();

        if (empty($permissionIds)) return;

        \DB::table('role_has_permissions')->insert(
            array_map(fn ($pid) => [
                'permission_id' => $pid,
                'role_id'       => $roleId,
            ], $permissionIds)
        );
    }
}
