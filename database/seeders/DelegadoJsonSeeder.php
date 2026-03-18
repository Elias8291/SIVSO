<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa delegado desde database/seeders/json/delegado.json o .csv
 */
class DelegadoJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        $data = $this->loadData('delegado');
        if (empty($data)) {
            $this->command->warn('Archivo no encontrado o vacío: delegado.json / delegado.csv');
            return;
        }

        $columns = ['nombre', 'delegacion', 'ur'];
        $rows = [];
        foreach ($data as $row) {
            $filtered = array_intersect_key($row, array_flip($columns));
            if (! empty($filtered)) {
                $rows[] = $filtered;
            }
        }
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::connection(self::CONNECTION)->table('delegado')->insertOrIgnore($chunk);
        }

        $this->command->info('Delegado: ' . count($rows) . ' registros importados.');
    }
}
