<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Lista completa para dropdowns (modal de roles)
        if ($request->boolean('all')) {
            return response()->json([
                'data' => Permission::orderBy('name')->get(['id', 'name', 'guard_name']),
            ]);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $search  = trim((string) $request->get('search', ''));

        $query = Permission::select('id', 'name', 'guard_name', 'created_at')
            ->orderBy('name');

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('guard_name')) {
            $query->where('guard_name', $request->get('guard_name'));
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->values(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem() ?? 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'nullable|string|max:255',
        ]);

        $permission = Permission::create([
            'name'       => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);

        return response()->json(['message' => 'Permiso creado correctamente.', 'id' => $permission->id], 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        return response()->json([
            'id'         => $permission->id,
            'name'       => $permission->name,
            'guard_name' => $permission->guard_name,
        ]);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255', Rule::unique('permissions', 'name')->ignore($permission->id)],
            'guard_name' => 'nullable|string|max:255',
        ]);

        $permission->name       = $data['name'];
        $permission->guard_name = $data['guard_name'] ?? $permission->guard_name;
        $permission->save();

        return response()->json(['message' => 'Permiso actualizado correctamente.']);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        \DB::table('role_has_permissions')->where('permission_id', $permission->id)->delete();
        \DB::table('model_has_permissions')->where('permission_id', $permission->id)->delete();
        $permission->delete();

        return response()->json(['message' => 'Permiso eliminado correctamente.']);
    }
}
