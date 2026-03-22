<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class ProductosSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('productos', 'productos', ignoreColumns: ['categoria_id']);
    }
}
