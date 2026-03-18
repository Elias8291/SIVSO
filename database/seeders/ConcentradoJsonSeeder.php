<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Importa concentrado desde database/seeders/json/concentrado.json o .csv
 * Usa streaming para archivos grandes (evita agotar memoria).
 */
class ConcentradoJsonSeeder extends Seeder
{
    use LoadsJsonOrCsv;

    private const CONNECTION = 'bas_vestuario';

    public function run(): void
    {
        ini_set('memory_limit', '256M');

        $columns = [
            'nue', 'ur', 'nombre_trab', 'apellp_trab', 'apellm_trab',
            'dependencia', 'ur_dependencia', 'cantidad', 'cantidad2',
            'clave2025', 'descripcion', 'precio_unitario', 'importe',
            'iva', 'total', 'no_partida', 'partida_descripcion',
            'clave_partida', 'clave_descripcion_partida', 'clave_descripcion',
            'clave_presupuestal', 'talla',
        ];

        $total = $this->loadDataStreaming('concentrado', $columns, 500, function (array $chunk): void {
            DB::connection(self::CONNECTION)->table('concentrado')->insertOrIgnore($chunk);
        });

        if ($total === 0) {
            $this->command->warn('Archivo no encontrado o vacío: concentrado.json / concentrado.csv');
            return;
        }

        $this->command->info("Concentrado: {$total} registros importados.");
    }
}
