<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class DependenciasSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('dependencias', 'dependencias');
    }
}
