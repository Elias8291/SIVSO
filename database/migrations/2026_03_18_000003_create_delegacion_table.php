<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: delegacion (bas_vestuario)
 * Trabajadores/empleados por delegación y UR.
 * delegacion (con guión ej: "3B-101"); delegado.delegacion (sin guión "3B101").
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('delegacion', function (Blueprint $table) {
            $table->id();
            $table->string('nue', 15)->comment('NUE del trabajador');
            $table->string('nombre_trab')->nullable();
            $table->string('apellp_trab')->nullable();
            $table->string('apellm_trab')->nullable();
            $table->string('delegacion', 30)->comment('Clave delegación, ej: 3B-101');
            $table->unsignedInteger('ur')->comment('Unidad Receptora → dependences.key (int, MySQL convierte con key varchar)');
            $table->string('dependencia')->nullable();

            $table->index(['nue', 'delegacion']);
            $table->index('ur');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('delegacion');
    }
};
