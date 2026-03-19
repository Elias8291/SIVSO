<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $search  = trim((string) $request->get('search', ''));

        // Si se pide la lista completa (para dropdowns en modales)
        if ($request->boolean('all')) {
            return response()->json([
                'data' => User::orderBy('name')->get(['id', 'name', 'rfc', 'email', 'activo']),
            ]);
        }

        $query = User::select('id', 'name', 'rfc', 'email', 'activo')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name',  'like', "%{$search}%")
                  ->orWhere('rfc',  'like', "%{$search}%")
                  ->orWhere('email','like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($perPage);

        // 1 sola query para todos los roles de la página (evita N+1)
        $userIds  = $paginated->pluck('id');
        $rolesMap = \DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->whereIn('model_has_roles.model_id', $userIds)
            ->where('model_has_roles.model_type', User::class)
            ->select('model_has_roles.model_id', 'roles.id as role_id', 'roles.name as role_name')
            ->get()
            ->groupBy('model_id');

        $data = $paginated->map(fn ($u) => [
            'id'     => $u->id,
            'name'   => $u->name,
            'rfc'    => $u->rfc,
            'email'  => $u->email,
            'activo' => (bool) $u->activo,
            'roles'  => $rolesMap->get($u->id, collect())->pluck('role_id'),
            'roles_names' => $rolesMap->get($u->id, collect())->pluck('role_name'),
        ])->values();

        return response()->json([
            'data' => $data,
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

    public function show(User $user): JsonResponse
    {
        $roles = \DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->pluck('role_id')
            ->values()
            ->all();

        return response()->json([
            'id'     => $user->id,
            'name'   => $user->name,
            'rfc'    => $user->rfc,
            'email'  => $user->email,
            'activo' => (bool) $user->activo,
            'roles'  => $roles->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'rfc'      => 'required|string|max:20|unique:users,rfc',
            'email'    => 'nullable|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'activo'   => 'boolean',
            'roles'    => 'array',
            'roles.*'  => 'integer|exists:roles,id',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'rfc'      => strtoupper($data['rfc']),
            'email'    => $data['email'] ?? null,
            'password' => Hash::make($data['password']),
            'activo'   => $data['activo'] ?? false,
        ]);

        $this->syncRoles($user->id, $data['roles'] ?? []);

        return response()->json(['message' => 'Usuario creado correctamente.', 'id' => $user->id], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'rfc'      => ['required', 'string', 'max:20', Rule::unique('users', 'rfc')->ignore($user->id)],
            'email'    => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'activo'   => 'boolean',
            'roles'    => 'array',
            'roles.*'  => 'integer|exists:roles,id',
        ]);

        $user->name   = $data['name'];
        $user->rfc    = strtoupper($data['rfc']);
        $user->email  = $data['email'] ?? null;
        $user->activo = $data['activo'] ?? $user->activo;

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $this->syncRoles($user->id, $data['roles'] ?? []);

        return response()->json(['message' => 'Usuario actualizado correctamente.']);
    }

    public function destroy(User $user): JsonResponse
    {
        \DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('model_type', User::class)
            ->delete();
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    public function toggleActivo(User $user): JsonResponse
    {
        $user->activo = !$user->activo;
        $user->save();

        return response()->json([
            'message' => $user->activo ? 'Usuario activado.' : 'Usuario desactivado.',
            'activo'  => $user->activo,
        ]);
    }

    private function syncRoles(int $userId, array $roleIds): void
    {
        \DB::table('model_has_roles')
            ->where('model_id', $userId)
            ->where('model_type', User::class)
            ->delete();

        if (empty($roleIds)) return;

        \DB::table('model_has_roles')->insert(
            array_map(fn ($id) => [
                'role_id'    => $id,
                'model_type' => User::class,
                'model_id'   => $userId,
            ], $roleIds)
        );
    }
}
