<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class DependenciaDelegacionSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('dependencia_delegacion', 'dependencia_delegacion');
    }
}
