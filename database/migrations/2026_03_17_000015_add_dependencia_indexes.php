<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega índices simples en dependencia_clave para acelerar los
 * COUNT(*) GROUP BY en DependenciaController y DelegacionController.
 */
return new class extends Migration
{
    public function up(): void
    {
        // delegaciones.dependencia_clave (standalone, para WHERE/GROUP BY)
        Schema::table('delegaciones', function (Blueprint $table) {
            if (! $this->hasIndex('delegaciones', 'idx_del_dep_clave')) {
                $table->index('dependencia_clave', 'idx_del_dep_clave');
            }
        });

        // empleados.dependencia_clave (standalone — el índice compuesto existente
        // empieza por delegacion_clave, no sirve para filtrar solo por dependencia_clave)
        Schema::table('empleados', function (Blueprint $table) {
            if (! $this->hasIndex('empleados', 'idx_emp_dep_clave')) {
                $table->index('dependencia_clave', 'idx_emp_dep_clave');
            }
        });

        // delegado_delegacion: índices para las consultas de asignaciones
        Schema::table('delegado_delegacion', function (Blueprint $table) {
            if (! $this->hasIndex('delegado_delegacion', 'idx_dd_del_dep')) {
                $table->index(['delegacion_clave', 'dependencia_clave', 'activo'], 'idx_dd_del_dep');
            }
        });
    }

    public function down(): void
    {
        Schema::table('delegaciones',      fn ($t) => $t->dropIndexIfExists('idx_del_dep_clave'));
        Schema::table('empleados',         fn ($t) => $t->dropIndexIfExists('idx_emp_dep_clave'));
        Schema::table('delegado_delegacion', fn ($t) => $t->dropIndexIfExists('idx_dd_del_dep'));
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(\DB::select("SHOW INDEX FROM `{$table}`"))
            ->contains('Key_name', $index);
    }
};
