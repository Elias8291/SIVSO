<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class ProveedoresSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('proveedores', 'proveedores');
    }
}
