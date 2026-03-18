<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Ejecuta todos los seeders en orden.
     * Ejecutar: php artisan db:seed
     */
    public function run(): void
    {
        $this->command->info('=== SIVSO — Seeding database ===');

        // 1. Usuarios base (users)
        $this->call(UserSeeder::class);

        // 2. Superadmin + rol (users, roles, model_has_roles)
        $this->call(SuperAdminSeeder::class);

        // 3. Permisos y roles (permissions, roles, role_has_permissions)
        $this->call(RolesPermissionsSeeder::class);

        // 4. Datos bas_vestuario desde JSON/CSV (dependences, proveedor, delegacion, delegado, propuesta, concentrado)
        $this->call([
            DependencesJsonSeeder::class,
            ProveedorJsonSeeder::class,
            DelegacionJsonSeeder::class,
            DelegadoJsonSeeder::class,
            PropuestaJsonSeeder::class,
            ConcentradoJsonSeeder::class,
        ]);

        $this->command->info('=== Seeding completado ===');
    }
}
