<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa dependences desde database/seeders/json/dependences.json o .csv
 */
class DependencesJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        $data = $this->loadData('dependences');
        if (empty($data)) {
            $this->command->warn('Archivo no encontrado o vacío: dependences.json / dependences.csv');
            return;
        }

        $columns = ['key', 'name'];
        $rows = [];
        foreach ($data as $row) {
            $filtered = array_intersect_key($row, array_flip($columns));
            if (! empty($filtered)) {
                $rows[] = $filtered;
            }
        }
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::connection(self::CONNECTION)->table('dependences')->insertOrIgnore($chunk);
        }

        $this->command->info('Dependences: ' . count($rows) . ' registros importados.');
    }
}
