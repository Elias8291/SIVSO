<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'ver_catalogo',
            'editar_catalogo',
            'ver_empleados',
            'editar_empleados',
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
            'eliminar_seleccion',
            'ver_reportes',
            'gestionar_usuarios',
            'gestionar_roles',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions);

        $delegado = Role::firstOrCreate(['name' => 'delegado']);
        $delegado->syncPermissions([
            'ver_catalogo',
            'ver_empleados',
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
            'ver_reportes',
        ]);

        $empleado = Role::firstOrCreate(['name' => 'empleado']);
        $empleado->syncPermissions([
            'ver_catalogo',
            'ver_selecciones',
            'crear_seleccion',
        ]);

        $consulta = Role::firstOrCreate(['name' => 'consulta']);
        $consulta->syncPermissions([
            'ver_catalogo',
            'ver_empleados',
            'ver_selecciones',
            'ver_reportes',
        ]);
    }
}
