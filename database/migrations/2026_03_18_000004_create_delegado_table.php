<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: delegado (bas_vestuario)
 * Delegados por Unidad Receptora.
 * delegacion sin guión (ej: "3B101"); delegacion.delegacion con guión ("3B-101").
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('delegado', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->comment('Nombre del delegado');
            $table->string('delegacion', 25)->comment('Clave sin guión');
            $table->unsignedInteger('ur')->comment('Unidad Receptora → dependences.key (int, MySQL convierte con key varchar)');

            $table->index('ur');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('delegado');
    }
};
