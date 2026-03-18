<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Orquesta todos los seeders de bas_vestuario desde JSON.
 * Orden: dependences → proveedor → delegacion → delegado → propuesta → concentrado
 */
class BasVestuarioJsonSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('=== Importación bas_vestuario desde JSON ===');

        $this->call([
            DependencesJsonSeeder::class,
            ProveedorJsonSeeder::class,
            DelegacionJsonSeeder::class,
            DelegadoJsonSeeder::class,
            PropuestaJsonSeeder::class,
            ConcentradoJsonSeeder::class,
        ]);

        $this->command->info('=== Importación completada ===');
    }
}
