<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('selecciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('producto_talla_id')->constrained('producto_tallas')->cascadeOnDelete();
            $table->year('anio');
            $table->integer('cantidad')->default(1);
            $table->timestamps();

            $table->unique(['empleado_id', 'producto_talla_id', 'anio'], 'sel_emp_pt_anio_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('selecciones');
    }
};
