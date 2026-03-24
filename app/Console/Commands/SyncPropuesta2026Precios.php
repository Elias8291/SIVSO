<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SyncPropuesta2026Precios extends Command
{
    protected $signature = 'catalogo:sync-propuesta-2026
                            {--anio=2026 : Año destino en producto_precios}
                            {--dry-run : Lista filas que se aplicarían sin escribir en la base}';

    protected $description = 'Copia CLAVE y PRECIO_UNITARIO desde propuesta_2026 a producto_precios (por producto_id y año)';

    public function handle(): int
    {
        if (! Schema::hasTable('propuesta_2026')) {
            $this->error('La tabla propuesta_2026 no existe en la base de datos.');

            return self::FAILURE;
        }

        $anio = (int) $this->option('anio');
        $dryRun = (bool) $this->option('dry-run');

        $rows = DB::table('propuesta_2026')->get();
        if ($rows->isEmpty()) {
            $this->warn('propuesta_2026 no tiene filas.');

            return self::SUCCESS;
        }

        $productIds = DB::table('productos')->pluck('id')->flip()->all();
        $now = now();
        $payload = [];
        $skippedNoProduct = 0;
        $skippedInvalid = 0;

        foreach ($rows as $row) {
            $d = $this->normalizeRow($row);
            if ($d === null) {
                $skippedInvalid++;

                continue;
            }

            if (! isset($productIds[$d['producto_id']])) {
                $skippedNoProduct++;

                continue;
            }

            $payload[] = [
                'producto_id' => $d['producto_id'],
                'anio' => $anio,
                'clave' => $d['clave'],
                'precio_unitario' => $d['precio_unitario'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($skippedInvalid > 0) {
            $this->warn("Omitidas {$skippedInvalid} filas sin id, clave o precio válidos.");
        }
        if ($skippedNoProduct > 0) {
            $this->warn("Omitidas {$skippedNoProduct} filas cuyo id no existe en productos.");
        }

        if ($payload === []) {
            $this->error('No hay filas válidas para sincronizar.');

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->info('[dry-run] Se aplicarían '.count($payload).' registros en producto_precios (año '.$anio.').');

            return self::SUCCESS;
        }

        foreach (array_chunk($payload, 250) as $chunk) {
            DB::table('producto_precios')->upsert(
                $chunk,
                ['producto_id', 'anio'],
                ['clave', 'precio_unitario', 'updated_at']
            );
        }

        $this->info('Sincronizados '.count($payload).' precios para el año '.$anio.'.');

        return self::SUCCESS;
    }

    /**
     * @param  object|array<string, mixed>  $row
     * @return array{producto_id: int, clave: string, precio_unitario: string}|null
     */
    private function normalizeRow(object|array $row): ?array
    {
        $a = is_array($row) ? $row : (array) $row;
        $lower = array_change_key_case($a, CASE_LOWER);

        $id = $lower['id'] ?? null;
        if ($id === null || $id === '' || ! is_numeric($id)) {
            return null;
        }

        $productoId = (int) $id;
        if ($productoId < 1) {
            return null;
        }

        $claveRaw = $lower['clave'] ?? null;
        if ($claveRaw === null || trim((string) $claveRaw) === '') {
            return null;
        }
        $clave = strtoupper(substr(trim((string) $claveRaw), 0, 30));

        $precioRaw = $lower['precio_unitario'] ?? null;
        if ($precioRaw === null || $precioRaw === '' || ! is_numeric($precioRaw)) {
            return null;
        }
        $precio = number_format((float) $precioRaw, 2, '.', '');

        return [
            'producto_id' => $productoId,
            'clave' => $clave,
            'precio_unitario' => $precio,
        ];
    }
}
