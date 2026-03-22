<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class SeleccionesSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('selecciones', 'selecciones');
    }
}
