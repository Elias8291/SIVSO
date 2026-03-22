<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;

class TallasSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        $this->importCsv('tallas', 'tallas');
    }
}
