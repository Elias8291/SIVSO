<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class ProductoTallasSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('producto_tallas', 'producto_tallas');
    }
}
