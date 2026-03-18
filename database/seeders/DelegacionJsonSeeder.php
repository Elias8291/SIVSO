<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa delegacion desde database/seeders/json/delegacion.json o .csv
 */
class DelegacionJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        $data = $this->loadData('delegacion');
        if (empty($data)) {
            $this->command->warn('Archivo no encontrado o vacío: delegacion.json / delegacion.csv');
            return;
        }

        $columns = ['nue', 'nombre_trab', 'apellp_trab', 'apellm_trab', 'delegacion', 'ur', 'dependencia'];
        $rows = [];
        foreach ($data as $row) {
            $filtered = array_intersect_key($row, array_flip($columns));
            if (! empty($filtered)) {
                $rows[] = $filtered;
            }
        }
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::connection(self::CONNECTION)->table('delegacion')->insertOrIgnore($chunk);
        }

        $this->command->info('Delegacion: ' . count($rows) . ' registros importados.');
    }
}
