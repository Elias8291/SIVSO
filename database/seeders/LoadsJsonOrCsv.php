<?php

namespace Database\Seeders;

trait LoadsJsonOrCsv
{
    protected function loadData(string $baseName): array
    {
        $dir = database_path('seeders/json');
        $jsonPath = "{$dir}/{$baseName}.json";
        $csvPath = "{$dir}/{$baseName}.csv";

        if (file_exists($jsonPath)) {
            return $this->parseJsonFile($jsonPath);
        }
        if (file_exists($csvPath)) {
            return $this->parseCsvOrJsonlFile($csvPath);
        }

        return [];
    }

    /**
     * Procesa archivos grandes línea a línea (sin cargar todo en memoria).
     * Para JSONL o CSV. Llama al callback con cada chunk de filas.
     */
    protected function loadDataStreaming(string $baseName, array $columns, int $chunkSize, callable $onChunk): int
    {
        $dir = database_path('seeders/json');
        $jsonPath = "{$dir}/{$baseName}.json";
        $csvPath = "{$dir}/{$baseName}.csv";

        $path = file_exists($jsonPath) ? $jsonPath : (file_exists($csvPath) ? $csvPath : null);
        if (!$path) {
            return 0;
        }

        $firstLine = $this->readFirstLine($path);
        if ($firstLine === null) {
            return 0;
        }

        if (str_starts_with(trim($firstLine), '[') || str_starts_with(trim($firstLine), '{')) {
            return $this->streamJsonl($path, $columns, $chunkSize, $onChunk);
        }

        return $this->streamCsv($path, $columns, $chunkSize, $onChunk);
    }

    private function readFirstLine(string $path): ?string
    {
        $fh = fopen($path, 'r');
        if (!$fh) {
            return null;
        }
        $line = fgets($fh);
        fclose($fh);
        return $line !== false ? $line : null;
    }

    private function streamJsonl(string $path, array $columns, int $chunkSize, callable $onChunk): int
    {
        $fh = fopen($path, 'r');
        if (!$fh) {
            return 0;
        }

        $total = 0;
        $chunk = [];

        while (($line = fgets($fh)) !== false) {
            $line = trim($line);
            if ($line === '' || $line === '[' || $line === ']') {
                continue;
            }
            $line = rtrim(rtrim($line), ',');
            $obj = json_decode($line, true);
            if (is_array($obj)) {
                $filtered = array_intersect_key($obj, array_flip($columns));
                if (!empty($filtered)) {
                    $chunk[] = $filtered;
                    if (count($chunk) >= $chunkSize) {
                        $onChunk($chunk);
                        $total += count($chunk);
                        $chunk = [];
                    }
                }
            }
        }

        if (!empty($chunk)) {
            $onChunk($chunk);
            $total += count($chunk);
        }

        fclose($fh);
        return $total;
    }

    private function streamCsv(string $path, array $columns, int $chunkSize, callable $onChunk): int
    {
        $fh = fopen($path, 'r');
        if (!$fh) {
            return 0;
        }

        $firstLine = fgets($fh);
        $delimiter = str_contains($firstLine, ';') ? ';' : ',';
        rewind($fh);

        $header = fgetcsv($fh, 0, $delimiter);
        if (!$header) {
            fclose($fh);
            return 0;
        }

        $total = 0;
        $chunk = [];

        while (($row = fgetcsv($fh, 0, $delimiter)) !== false) {
            if (count($row) >= count($header)) {
                $assoc = array_combine($header, array_slice($row, 0, count($header)));
                $filtered = array_intersect_key($assoc, array_flip($columns));
                if (!empty($filtered)) {
                    $chunk[] = $filtered;
                    if (count($chunk) >= $chunkSize) {
                        $onChunk($chunk);
                        $total += count($chunk);
                        $chunk = [];
                    }
                }
            }
        }

        if (!empty($chunk)) {
            $onChunk($chunk);
            $total += count($chunk);
        }

        fclose($fh);
        return $total;
    }

    private function parseJsonFile(string $path): array
    {
        $raw = file_get_contents($path);
        $data = json_decode($raw, true);
        if (is_array($data)) {
            return $data;
        }
        return $this->parseJsonl($raw);
    }

    private function parseCsvOrJsonlFile(string $path): array
    {
        $raw = file_get_contents($path);
        $first = trim(explode("\n", $raw)[0] ?? '');

        if (str_starts_with($first, '[') || str_starts_with($first, '{')) {
            return $this->parseJsonOrJsonl($raw);
        }

        return $this->parseCsv($path);
    }

    private function parseJsonOrJsonl(string $raw): array
    {
        $data = json_decode($raw, true);
        if (is_array($data)) {
            return $data;
        }
        return $this->parseJsonl($raw);
    }

    private function parseJsonl(string $raw): array
    {
        $data = [];
        foreach (explode("\n", $raw) as $line) {
            $line = trim($line);
            if ($line === '' || $line === '[' || $line === ']') {
                continue;
            }
            $line = rtrim(rtrim($line), ',');
            $obj = json_decode($line, true);
            if (is_array($obj)) {
                $data[] = $obj;
            }
        }
        return $data;
    }

    private function parseCsv(string $path): array
    {
        $fh = fopen($path, 'r');
        if (!$fh) {
            return [];
        }
        $firstLine = fgets($fh);
        $delimiter = str_contains($firstLine, ';') ? ';' : ',';
        rewind($fh);

        $header = fgetcsv($fh, 0, $delimiter);
        if (!$header) {
            fclose($fh);
            return [];
        }

        $data = [];
        while (($row = fgetcsv($fh, 0, $delimiter)) !== false) {
            if (count($row) >= count($header)) {
                $data[] = array_combine($header, array_slice($row, 0, count($header)));
            }
        }
        fclose($fh);
        return $data;
    }
}
