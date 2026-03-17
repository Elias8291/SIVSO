<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolesPermissionsSeeder extends Seeder
{
    private const MODULES = [
        'usuarios'    => ['ver', 'crear', 'editar', 'eliminar'],
        'roles'       => ['ver', 'crear', 'editar', 'eliminar'],
        'permisos'    => ['ver', 'crear', 'editar', 'eliminar'],
        'empleados'   => ['ver', 'crear', 'editar', 'eliminar'],
        'inventario'  => ['ver', 'crear', 'editar', 'eliminar'],
        'solicitudes' => ['ver', 'crear', 'editar', 'eliminar'],
        'asignaciones'=> ['ver', 'crear', 'editar', 'eliminar'],
        'reportes'    => ['ver', 'exportar'],
    ];

    public function run(): void
    {
        // ── Crear permisos ────────────────────────────────────────────────
        $permissionMap = [];

        foreach (self::MODULES as $module => $actions) {
            foreach ($actions as $action) {
                $name = "{$module}.{$action}";
                $permission = Permission::firstOrCreate(
                    ['name' => $name, 'guard_name' => 'web']
                );
                $permissionMap[$name] = $permission->id;
            }
        }

        // ── Crear roles y asignar permisos ────────────────────────────────

        // Superadmin: todos los permisos (ya existe del SuperAdminSeeder)
        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->syncRolePermissions($superadmin->id, array_values($permissionMap));

        // Admin: todo excepto eliminar usuarios/roles/permisos
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminPermisos = array_filter($permissionMap, fn ($key) => !in_array($key, [
            'usuarios.eliminar', 'roles.eliminar', 'permisos.eliminar',
        ], true), ARRAY_FILTER_USE_KEY);
        $this->syncRolePermissions($admin->id, array_values($adminPermisos));

        // Delegado: ver/crear solicitudes y asignaciones, ver empleados e inventario
        $delegado = Role::firstOrCreate(['name' => 'delegado', 'guard_name' => 'web']);
        $delegadoPermisos = array_intersect_key($permissionMap, array_flip([
            'solicitudes.ver', 'solicitudes.crear', 'solicitudes.editar',
            'asignaciones.ver', 'asignaciones.crear',
            'empleados.ver',
            'inventario.ver',
            'reportes.ver',
        ]));
        $this->syncRolePermissions($delegado->id, array_values($delegadoPermisos));

        // Empleado: solo ver
        $empleadoRole = Role::firstOrCreate(['name' => 'empleado', 'guard_name' => 'web']);
        $empleadoPermisos = array_intersect_key($permissionMap, array_flip([
            'solicitudes.ver',
            'inventario.ver',
        ]));
        $this->syncRolePermissions($empleadoRole->id, array_values($empleadoPermisos));

        // Asigna rol superadmin al usuario superadmin si existe
        $superUser = User::where('rfc', 'RAJE020226G97')->first();
        if ($superUser) {
            \DB::table('model_has_roles')->updateOrInsert([
                'role_id'    => $superadmin->id,
                'model_type' => User::class,
                'model_id'   => $superUser->id,
            ]);
        }

        $this->command->info('Roles y permisos creados: superadmin, admin, delegado, empleado.');
    }

    private function syncRolePermissions(int $roleId, array $permissionIds): void
    {
        \DB::table('role_has_permissions')->where('role_id', $roleId)->delete();

        $rows = array_map(fn ($pid) => ['permission_id' => $pid, 'role_id' => $roleId], $permissionIds);

        foreach (array_chunk($rows, 50) as $chunk) {
            \DB::table('role_has_permissions')->insert($chunk);
        }
    }
}
