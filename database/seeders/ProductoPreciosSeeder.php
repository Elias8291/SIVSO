<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class ProductoPreciosSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('producto_precios', 'producto_precios');
    }
}
