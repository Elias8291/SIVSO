<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class DelegadoDelegacionSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('delegado_delegacion', 'delegado_delegacion');
    }
}
