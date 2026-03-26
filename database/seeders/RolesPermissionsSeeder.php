<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Principal / UI
            'ver_dashboard',
            'ver_notificaciones',
            'enviar_notificaciones',
            'ver_organizacion',
            // Catálogo y empleados
            'ver_catalogo',
            'editar_catalogo',
            'ver_empleados',
            'ver_productos_empleado',
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

            // Permisos por módulo (acción explícita)
            'mi_vestuario.ver',
            'mi_vestuario.actualizar',
            'mi_vestuario.eliminar',

            'catalogo.crear',
            'catalogo.actualizar',
            'catalogo.eliminar',

            'empleados.crear',
            'empleados.actualizar',
            'empleados.eliminar',

            'dependencias.crear',
            'dependencias.actualizar',
            'dependencias.eliminar',

            'delegaciones.crear',
            'delegaciones.actualizar',
            'delegaciones.eliminar',

            'delegados.crear',
            'delegados.actualizar',
            'delegados.eliminar',

            'partidas.crear',
            'partidas.actualizar',
            'partidas.eliminar',

            'periodos.crear',
            'periodos.actualizar',
            'periodos.eliminar',

            'usuarios.crear',
            'usuarios.actualizar',
            'usuarios.eliminar',

            'roles.crear',
            'roles.actualizar',
            'roles.eliminar',

            'permisos.crear',
            'permisos.actualizar',
            'permisos.eliminar',
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

        // Delegación: acceso operativo por delegación (similar a delegado, sin edición de catálogo/usuarios).
        $delegacion = Role::firstOrCreate(['name' => 'delegacion']);
        $delegacion->syncPermissions([
            'ver_dashboard',
            'ver_notificaciones',
            'ver_empleados',
            'ver_productos_empleado',
            'ver_selecciones',
            'crear_seleccion',
            'editar_seleccion',
            'ver_reportes',
            'ver_mi_delegacion',
            'ver_dependencias',
            'ver_delegaciones',
            'ver_partidas',
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
            'ver_productos_empleado',
            'ver_selecciones',
            'ver_reportes',
            'ver_dependencias',
            'ver_delegaciones',
            'ver_delegados',
            'ver_partidas',
        ]);
    }
}
