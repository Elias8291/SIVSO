<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $perm = Permission::firstOrCreate(
            ['name' => 'ver_productos_empleado'],
            ['guard_name' => 'web']
        );

        foreach (['admin', 'consulta'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role && ! $role->hasPermissionTo($perm)) {
                $role->givePermissionTo($perm);
            }
        }
    }

    public function down(): void
    {
        Permission::where('name', 'ver_productos_empleado')->delete();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
