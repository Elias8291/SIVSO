<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodos', function (Blueprint $table) {
            $table->id();
            $table->year('anio');
            $table->string('nombre');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->enum('estado', ['abierto', 'cerrado', 'pendiente'])->default('pendiente');
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->unique(['anio', 'nombre'], 'periodo_anio_nombre_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodos');
    }
};
