<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vestuario_ejercicio_cerrado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->unsignedSmallInteger('anio');
            $table->timestamps();

            $table->unique(['empleado_id', 'anio'], 'vestuario_cerrado_emp_anio_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vestuario_ejercicio_cerrado');
    }
};
