<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExportSeleccionesCsv extends Command
{
    protected $signature = 'export:selecciones-csv
                            {--path= : Ruta destino (default database/seeders/json/selecciones.csv)}
                            {--anio= : Filtrar por año (opcional)}
                            {--limit= : Limitar filas (debug)}
                            {--no-header : No escribir encabezado}';

    protected $description = 'Exporta la tabla selecciones al CSV usado por seeders (database/seeders/json/selecciones.csv)';

    public function handle(): int
    {
        if (! Schema::hasTable('selecciones')) {
            $this->error('La tabla selecciones no existe en la base de datos.');
            return self::FAILURE;
        }
        if (! Schema::hasTable('empleados') || ! Schema::hasTable('producto_tallas') || ! Schema::hasTable('producto_precios')) {
            $this->error('Faltan tablas requeridas: empleados, producto_tallas o producto_precios.');
            return self::FAILURE;
        }

        $dest = (string) ($this->option('path') ?: database_path('seeders/json/selecciones.csv'));
        $anio = $this->option('anio');
        $limit = $this->option('limit');

        $q = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'pt.producto_id')
                    ->on('pp.anio', '=', 's.anio');
            })
            ->select([
                's.id',
                's.empleado_id',
                's.producto_talla_id',
                'e.dependencia_id',
                's.anio',
                's.cantidad',
                'pp.precio_unitario',
            ])
            ->orderBy('s.id');

        if ($anio !== null && $anio !== '' && is_numeric($anio)) {
            $q->where('s.anio', (int) $anio);
        }
        if ($limit !== null && $limit !== '' && is_numeric($limit)) {
            $q->limit((int) $limit);
        }

        $handle = @fopen($dest, 'wb');
        if (! $handle) {
            $this->error("No se pudo abrir el archivo destino: {$dest}");
            return self::FAILURE;
        }

        $columns = ['id', 'empleado_id', 'producto_talla_id', 'dependencia_id', 'anio', 'cantidad', 'importe', 'iva', 'total'];

        if (! $this->option('no-header')) {
            fputcsv($handle, $columns);
        }

        $count = 0;
        $missingPrecio = 0;

        $q->chunk(1000, function ($rows) use (&$count, &$missingPrecio, $handle) {
            foreach ($rows as $r) {
                $precio = $r->precio_unitario;
                if ($precio === null || $precio === '') {
                    $missingPrecio++;
                    $precioNum = 0.0;
                } else {
                    $precioNum = (float) $precio;
                }

                $cantidad = (int) ($r->cantidad ?? 0);
                $importe = round($precioNum * $cantidad, 2);
                $iva = round($importe * 0.16, 2);
                $total = round($importe + $iva, 2);

                fputcsv($handle, [
                    (int) $r->id,
                    (int) $r->empleado_id,
                    (int) $r->producto_talla_id,
                    (int) $r->dependencia_id,
                    (int) $r->anio,
                    $cantidad,
                    number_format($importe, 2, '.', ''),
                    number_format($iva, 2, '.', ''),
                    number_format($total, 2, '.', ''),
                ]);
                $count++;
            }
        });

        fclose($handle);

        $this->info("Exportadas {$count} filas a {$dest}");
        if ($missingPrecio > 0) {
            $this->warn("Aviso: {$missingPrecio} filas sin precio_unitario (importe/iva/total quedaron en 0.00).");
        }

        return self::SUCCESS;
    }
}

