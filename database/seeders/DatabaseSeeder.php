<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Catálogos base
            DependenciasSeeder::class,
            DelegacionesSeeder::class,
            DelegadosSeeder::class,
            ProveedoresSeeder::class,
            PartidasSeeder::class,
            TallasSeeder::class,

            // Pivotes organizacionales
            DependenciaDelegacionSeeder::class,
            DelegadoDelegacionSeeder::class,

            // Productos
            ProductosSeeder::class,
            ProductoPreciosSeeder::class,
            ProductoTallasSeeder::class,

            // Empleados y selecciones
            EmpleadosSeeder::class,
            SeleccionesSeeder::class,

            // Roles y permisos (Spatie)
            RolesPermissionsSeeder::class,
        ]);
    }
}
