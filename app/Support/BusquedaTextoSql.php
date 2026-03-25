<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Utilidades para LIKE y comparación sin acentos en SQL (MySQL / SQLite),
 * y búsqueda por palabras en PHP.
 */
final class BusquedaTextoSql
{
    /**
     * Cada palabra de $search debe aparecer en $haystack (orden libre), ignorando acentos.
     */
    public static function phpHaystackTieneTokens(string $haystack, string $search): bool
    {
        $search = trim($search);
        if ($search === '') {
            return true;
        }

        $tokens = preg_split('/\s+/u', $search, -1, PREG_SPLIT_NO_EMPTY);
        if ($tokens === []) {
            return true;
        }

        $norm = mb_strtoupper(Str::ascii($haystack), 'UTF-8');

        foreach ($tokens as $token) {
            $tn = mb_strtoupper(Str::ascii($token), 'UTF-8');
            if ($tn === '') {
                continue;
            }
            if (mb_stripos($norm, $tn) === false) {
                return false;
            }
        }

        return true;
    }

    public static function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /** Expresión: texto en mayúsculas sin acentos. Acepta `columna` o `tabla.columna`. */
    public static function sqlSpanishFoldUpper(string $column): string
    {
        $qualified = self::qualifyColumn($column);
        $expr = $qualified;
        foreach ([
            ['Á', 'A'], ['É', 'E'], ['Í', 'I'], ['Ó', 'O'], ['Ú', 'U'], ['Ñ', 'N'],
            ['á', 'a'], ['é', 'e'], ['í', 'i'], ['ó', 'o'], ['ú', 'u'], ['ñ', 'n'],
        ] as [$from, $to]) {
            $expr = "REPLACE({$expr},'{$from}','{$to}')";
        }

        return "UPPER({$expr})";
    }

    private static function qualifyColumn(string $column): string
    {
        if (! str_contains($column, '.')) {
            return '`'.str_replace('`', '``', $column).'`';
        }

        [$table, $col] = explode('.', $column, 2);

        return '`'.str_replace('`', '``', $table).'`.`'.str_replace('`', '``', $col).'`';
    }
}
