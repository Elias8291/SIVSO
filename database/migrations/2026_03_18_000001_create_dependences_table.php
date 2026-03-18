<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: dependences (bas_vestuario)
 * Unidades Receptoras (UR).
 * key (varchar 5) es el identificador usado por delegacion.ur y delegado.ur.
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('dependences', function (Blueprint $table) {
            $table->id();
            $table->string('key', 5)->unique()->comment('Clave UR');
            $table->string('name')->comment('Nombre de la Unidad Receptora');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('dependences');
    }
};
