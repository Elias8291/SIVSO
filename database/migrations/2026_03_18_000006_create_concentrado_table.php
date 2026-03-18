<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: concentrado (bas_vestuario)
 * Registro de vestuario asignado por trabajador y partida.
 * no_partida → propuesta.id
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('concentrado', function (Blueprint $table) {
            $table->id();
            $table->string('nue', 15)->comment('NUE del trabajador');
            $table->unsignedInteger('ur')->nullable()->comment('Unidad Receptora → dependences.key');
            $table->string('nombre_trab')->nullable();
            $table->string('apellp_trab')->nullable();
            $table->string('apellm_trab')->nullable();
            $table->string('dependencia')->nullable();
            $table->string('ur_dependencia')->nullable();
            $table->integer('cantidad')->nullable();
            $table->integer('cantidad2')->nullable();
            $table->string('clave2025', 50)->nullable()->comment('Clave producto / codigo propuesta');
            $table->string('descripcion')->nullable();
            $table->decimal('precio_unitario', 12, 2)->nullable();
            $table->decimal('importe', 12, 2)->nullable();
            $table->decimal('iva', 12, 2)->nullable();
            $table->decimal('total', 12, 2)->nullable();
            $table->unsignedBigInteger('no_partida')->nullable()->comment('propuesta.id');
            $table->string('partida_descripcion')->nullable();
            $table->string('clave_partida')->nullable();
            $table->string('clave_descripcion_partida')->nullable();
            $table->string('clave_descripcion')->nullable();
            $table->string('clave_presupuestal')->nullable();
            $table->string('talla', 10)->nullable();

            $table->index(['nue', 'ur']);
            $table->index('clave2025');
            $table->index('no_partida');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('concentrado');
    }
};
