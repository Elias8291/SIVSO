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
            // Principal / UI
            'ver_dashboard',
            'ver_notificaciones',
            'ver_organizacion',
            // Catálogo y empleados
            'ver_catalogo',
            'editar_catalogo',
            'ver_empleados',
            'editar_empleados',
            // Vestuario / selecciones
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
            'eliminar_seleccion',
            'ver_reportes',
            'editar_reportes',
            // Administración
            'gestionar_usuarios',
            'gestionar_roles',
            'gestionar_permisos',
            'gestionar_periodos',
            // Estructura y partidas / mi delegación
            'ver_dependencias',
            'editar_dependencias',
            'ver_delegaciones',
            'editar_delegaciones',
            'ver_delegados',
            'editar_delegados',
            'ver_partidas',
            'editar_partidas',
            'ver_mi_delegacion',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions($permissions);

        $delegado = Role::firstOrCreate(['name' => 'delegado']);
        $delegado->syncPermissions([
            'ver_dashboard',
            'ver_notificaciones',
            'ver_catalogo',
            'ver_empleados',
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
            'ver_reportes',
            'ver_mi_delegacion',
            'ver_partidas',
            'ver_dependencias',
            'ver_delegaciones',
        ]);

        // Colaborador: solo inicio personal, vestuario, cuenta y avisos (sin catálogo ni módulos de gestión)
        $empleado = Role::firstOrCreate(['name' => 'empleado']);
        $empleado->syncPermissions([
            'ver_dashboard',
            'ver_notificaciones',
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
        ]);

        $consulta = Role::firstOrCreate(['name' => 'consulta']);
        $consulta->syncPermissions([
            'ver_dashboard',
            'ver_notificaciones',
            'ver_organizacion',
            'ver_catalogo',
            'ver_empleados',
            'ver_selecciones',
            'ver_reportes',
            'ver_dependencias',
            'ver_delegaciones',
            'ver_delegados',
            'ver_partidas',
        ]);
    }
}
