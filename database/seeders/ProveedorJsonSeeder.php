<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa proveedor desde database/seeders/json/proveedor.json o .csv
 */
class ProveedorJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        $data = $this->loadData('proveedor');
        if (empty($data)) {
            $this->command->warn('Archivo no encontrado o vacío: proveedor.json / proveedor.csv');
            return;
        }

        $columns = ['pv', 'rfc', 'proveedor', 'direccion', 'telefono', 'abreviacion', 'numero'];
        $rows = [];
        foreach ($data as $row) {
            $filtered = array_intersect_key($row, array_flip($columns));
            if (! empty($filtered)) {
                $rows[] = $filtered;
            }
        }
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::connection(self::CONNECTION)->table('proveedor')->insertOrIgnore($chunk);
        }

        $this->command->info('Proveedor: ' . count($rows) . ' registros importados.');
    }
}
