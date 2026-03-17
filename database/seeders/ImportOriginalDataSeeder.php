<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Importa toda la información de bas_vestuario (tablas legacy) a la
 * base sivso-2026-2 (tablas nuevas del sistema).
 *
 * Tablas origen  → Tablas destino
 * dependences    → dependencias
 * delegacion     → empleados  +  delegaciones
 * delegado       → delegados  +  delegado_delegacion  +  delegaciones
 * propuesta      → partidas_presupuestales  +  productos
 * concentrado    → precios_producto  +  asignaciones_vestuario
 */
class ImportOriginalDataSeeder extends Seeder
{
    private const SRC  = 'bas_vestuario';
    private const ANIO = 2025;

    public function run(): void
    {
        $src  = self::SRC;
        $anio = self::ANIO;
        $now  = now();

        $this->command->info("=== SIVSO Import desde {$src} ===");

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach ([
            'asignaciones_vestuario', 'precios_producto', 'productos',
            'partidas_presupuestales', 'delegado_delegacion', 'delegados',
            'empleados', 'delegaciones', 'dependencias',
        ] as $t) {
            DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        /* ────────────────────────────────────────────────────────────
         *  1. DEPENDENCIAS  (dependences.key → dependencias.clave)
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('1/7  dependencias...');
        DB::statement("
            INSERT IGNORE INTO dependencias (clave, nombre, activa, created_at, updated_at)
            SELECT `key`, MAX(`name`), 1, NOW(), NOW()
            FROM `{$src}`.`dependences`
            GROUP BY `key`
        ");
        $this->command->line('     ' . DB::table('dependencias')->count() . ' registros');

        /* ────────────────────────────────────────────────────────────
         *  2. DELEGACIONES  (unique delegacion+ur de delegacion y delegado)
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('2/7  delegaciones...');
        DB::statement("
            INSERT IGNORE INTO delegaciones (clave, dependencia_clave, nombre, activa, created_at, updated_at)
            SELECT DISTINCT
                d.delegacion,
                CAST(d.ur AS CHAR),
                d.delegacion,
                1, NOW(), NOW()
            FROM `{$src}`.`delegacion` d
        ");
        DB::statement("
            INSERT IGNORE INTO delegaciones (clave, dependencia_clave, nombre, activa, created_at, updated_at)
            SELECT DISTINCT
                dg.delegacion,
                CAST(dg.ur AS CHAR),
                dg.delegacion,
                1, NOW(), NOW()
            FROM `{$src}`.`delegado` dg
        ");
        $this->command->line('     ' . DB::table('delegaciones')->count() . ' registros');

        /* ────────────────────────────────────────────────────────────
         *  3. EMPLEADOS  (delegacion → empleados)
         *     clave única: (nue, delegacion_clave)
         *     nues inválidos ("-", "0") se importan con activo=0
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('3/7  empleados...');
        DB::statement("
            INSERT IGNORE INTO empleados
                (nue, nombre, apellido_paterno, apellido_materno,
                 delegacion_clave, dependencia_clave, activo, created_at, updated_at)
            SELECT
                d.nue,
                d.nombre_trab,
                d.apellp_trab,
                d.apellm_trab,
                d.delegacion,
                CAST(d.ur AS CHAR),
                IF(d.nue REGEXP '^[0-9]+$' AND d.nue != '0', 1, 0),
                NOW(), NOW()
            FROM `{$src}`.`delegacion` d
        ");
        $this->command->line('     ' . DB::table('empleados')->count() . ' registros');

        /* ────────────────────────────────────────────────────────────
         *  4. DELEGADOS  +  DELEGADO_DELEGACION
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('4/7  delegados...');
        DB::statement("
            INSERT IGNORE INTO delegados (nombre_completo, activo, created_at, updated_at)
            SELECT DISTINCT TRIM(nombre), 1, NOW(), NOW()
            FROM `{$src}`.`delegado`
        ");

        DB::statement("
            INSERT IGNORE INTO delegado_delegacion
                (delegado_id, delegacion_clave, dependencia_clave, activo, fecha_inicio)
            SELECT
                del.id,
                src.delegacion,
                CAST(src.ur AS CHAR),
                1,
                NOW()
            FROM `{$src}`.`delegado` src
            JOIN delegados del ON del.nombre_completo = TRIM(src.nombre)
        ");
        $this->command->line('     delegados: ' . DB::table('delegados')->count()
            . '   asignaciones: ' . DB::table('delegado_delegacion')->count());

        /* ────────────────────────────────────────────────────────────
         *  5. PARTIDAS PRESUPUESTALES  (propuesta → partidas_presupuestales)
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('5/7  partidas_presupuestales + productos...');
        DB::statement("
            INSERT IGNORE INTO partidas_presupuestales
                (partida, partida_especifica, lote, descripcion, clave_partida, created_at, updated_at)
            SELECT
                p.partida,
                p.partida_especifica,
                p.lote,
                p.descripcion,
                CONCAT('L', p.lote, '-', p.partida_especifica, '-', p.partida),
                NOW(), NOW()
            FROM `{$src}`.`propuesta` p
        ");

        /* ────────────────────────────────────────────────────────────
         *  6. PRODUCTOS
         *     Cada clave2025 única del concentrado es un producto.
         *     La descripción y precio vienen del concentrado (producto
         *     real entregado, que puede diferir de la propuesta).
         *     Se une con propuesta por no_partida = propuesta.id para
         *     obtener lote, partida_especifica, partida, codigo, marca, etc.
         * ──────────────────────────────────────────────────────────── */
        DB::statement("
            INSERT IGNORE INTO productos
                (partida_presupuestal_id, partida, partida_especifica, lote,
                 codigo, clave_vestuario, descripcion, marca, unidad, medida,
                 activo, created_at, updated_at)
            SELECT
                pp.id,
                pr.partida,
                pr.partida_especifica,
                pr.lote,
                pr.codigo,
                c.clave2025,
                MAX(c.descripcion),
                pr.marca,
                pr.unidad,
                pr.medida,
                1, NOW(), NOW()
            FROM `{$src}`.`concentrado` c
            JOIN `{$src}`.`propuesta` pr ON pr.id = c.no_partida
            JOIN partidas_presupuestales pp
                ON pp.partida = pr.partida
                AND pp.partida_especifica = pr.partida_especifica
                AND pp.lote = pr.lote
            WHERE c.clave2025 IS NOT NULL AND c.clave2025 != ''
            GROUP BY pp.id, pr.partida, pr.partida_especifica, pr.lote,
                     pr.codigo, c.clave2025, pr.marca, pr.unidad, pr.medida
        ");
        $this->command->line('     partidas: ' . DB::table('partidas_presupuestales')->count()
            . '   productos: ' . DB::table('productos')->count());

        /* ────────────────────────────────────────────────────────────
         *  7. PRECIOS PRODUCTO (precio promedio por clave2025 para 2025)
         * ──────────────────────────────────────────────────────────── */
        DB::statement("
            INSERT IGNORE INTO precios_producto (producto_id, anio, precio_unitario, created_at)
            SELECT
                prod.id,
                {$anio},
                ROUND(AVG(c.precio_unitario), 2),
                NOW()
            FROM `{$src}`.`concentrado` c
            JOIN productos prod ON prod.clave_vestuario = c.clave2025
            WHERE c.precio_unitario IS NOT NULL AND c.precio_unitario > 0
            GROUP BY prod.id
        ");

        /* ────────────────────────────────────────────────────────────
         *  8. ASIGNACIONES DE VESTUARIO  (concentrado → asignaciones_vestuario)
         *     Join: concentrado.nue + ur → empleados por (nue, dep_clave)
         *     Si un NUE aparece en varias delegaciones del mismo UR,
         *     se toma la primera delegación alfabéticamente.
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('6/7  asignaciones_vestuario (107 k filas)...');
        DB::statement("
            INSERT INTO asignaciones_vestuario
                (empleado_id, producto_id, anio, cantidad, talla,
                 clave_variante, precio_unitario, importe, created_at, updated_at)
            SELECT
                e.id,
                prod.id,
                {$anio},
                c.cantidad,
                c.talla,
                c.clave2025,
                c.precio_unitario,
                c.importe,
                NOW(), NOW()
            FROM `{$src}`.`concentrado` c
            /* Resolver delegacion del empleado: si tiene varias en el mismo UR, tomar la menor */
            JOIN (
                SELECT nue, CAST(ur AS CHAR) AS dep_clave, MIN(delegacion) AS delegacion
                FROM `{$src}`.`delegacion`
                GROUP BY nue, ur
            ) dlg ON dlg.nue = c.nue AND dlg.dep_clave = CAST(c.ur AS CHAR)
            JOIN empleados e
                ON e.nue = c.nue
                AND e.delegacion_clave = dlg.delegacion
            JOIN productos prod ON prod.clave_vestuario = c.clave2025
            WHERE c.clave2025 IS NOT NULL AND c.clave2025 != ''
        ");
        $total = DB::table('asignaciones_vestuario')->count();
        $this->command->line("     {$total} asignaciones importadas");

        /* ────────────────────────────────────────────────────────────
         *  9. SUPERUSUARIO
         * ──────────────────────────────────────────────────────────── */
        $this->command->info('7/7  superusuario...');
        DB::table('users')->updateOrInsert(
            ['rfc' => 'RAJE020226G97'],
            [
                'name'     => 'Elias Abisai Ramos Jacinto',
                'email'    => 'abis71562@gmail.com',
                'password' => Hash::make('Angel1789'),
                'activo'   => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Vincular al empleado Aaron David Garcia Pablo si existe
        $userId = DB::table('users')->where('rfc', 'RAJE020226G97')->value('id');
        if ($userId) {
            // Buscar el empleado por NUE o nombre
            $emp = DB::table('empleados')
                ->where('nombre', 'LIKE', '%AARON%')
                ->where('apellido_paterno', 'LIKE', '%GARCIA%')
                ->first();
            if ($emp) {
                DB::table('empleados')->where('id', $emp->id)
                    ->update(['user_id' => $userId]);
                $this->command->line("     Empleado vinculado: {$emp->nombre} {$emp->apellido_paterno} (id={$emp->id})");
            }
        }

        $this->command->info('');
        $this->command->info('✓ Importación completada.');
        $this->command->table(
            ['Tabla', 'Registros'],
            [
                ['dependencias',         DB::table('dependencias')->count()],
                ['delegaciones',         DB::table('delegaciones')->count()],
                ['empleados',            DB::table('empleados')->count()],
                ['delegados',            DB::table('delegados')->count()],
                ['delegado_delegacion',  DB::table('delegado_delegacion')->count()],
                ['partidas_presupuestales', DB::table('partidas_presupuestales')->count()],
                ['productos',            DB::table('productos')->count()],
                ['precios_producto',     DB::table('precios_producto')->count()],
                ['asignaciones_vestuario', DB::table('asignaciones_vestuario')->count()],
                ['users',                DB::table('users')->count()],
            ]
        );
    }
}
