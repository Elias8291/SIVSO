<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa propuesta desde database/seeders/json/propuesta.json o .csv
 */
class PropuestaJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        $data = $this->loadData('propuesta');
        if (empty($data)) {
            $this->command->warn('Archivo no encontrado o vacío: propuesta.json / propuesta.csv');
            return;
        }

        $columns = [
            'id', 'partida', 'partida_especifica', 'lote', 'descripcion', 'cantidad',
            'unidad', 'marca', 'precio_unitario', 'subtotal', 'proveedor',
            'medida', 'codigo',
        ];
        $rows = [];
        foreach ($data as $row) {
            $filtered = array_intersect_key($row, array_flip($columns));
            if (! empty($filtered)) {
                $rows[] = $filtered;
            }
        }
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::connection(self::CONNECTION)->table('propuesta')->insertOrIgnore($chunk);
        }

        $this->command->info('Propuesta: ' . count($rows) . ' registros importados.');
    }
}
