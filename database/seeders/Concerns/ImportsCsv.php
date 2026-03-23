<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\DB;

trait ImportsCsv
{
    protected function importCsv(string $file, string $table, array $ignoreColumns = [], bool $ignoreDuplicates = false): void
    {
        $path = database_path("seeders/json/{$file}.csv");

        if (! file_exists($path)) {
            $this->command->warn("  Skipped: {$file}.csv not found");
            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);

        // Strip BOM from first column header
        if ($header && isset($header[0])) {
            $header[0] = preg_replace('/^\x{FEFF}/u', '', $header[0]);
        }

        $rows = [];
        $count = 0;

        while (($line = fgetcsv($handle)) !== false) {
            if (count($line) !== count($header)) {
                continue;
            }

            $row = array_combine($header, $line);

            foreach ($ignoreColumns as $col) {
                unset($row[$col]);
            }

            $row = array_map(fn ($v) => ($v === '' || $v === '?') ? null : $v, $row);

            $rows[] = $row;
            $count++;

            if ($count % 1000 === 0) {
                $ignoreDuplicates ? DB::table($table)->insertOrIgnore($rows) : DB::table($table)->insert($rows);
                $rows = [];
            }
        }

        if (! empty($rows)) {
            $ignoreDuplicates ? DB::table($table)->insertOrIgnore($rows) : DB::table($table)->insert($rows);
        }

        fclose($handle);
        $this->command->info("  {$table}: {$count} rows");
    }
}
