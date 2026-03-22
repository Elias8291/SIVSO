<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmpleadosSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        $this->importCsv('empleados', 'empleados');
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
}
