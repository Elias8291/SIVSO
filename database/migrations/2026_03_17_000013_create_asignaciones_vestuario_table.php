<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asignaciones_vestuario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos');
            $table->integer('anio');
            $table->integer('cantidad')->default(1);
            $table->string('talla', 10)->nullable();
            $table->string('clave_variante', 30)->nullable()->comment('Variante/talla específica: concentrado.clave2025');
            $table->decimal('precio_unitario', 10, 2)->nullable();
            $table->decimal('importe', 10, 2)->nullable();
            $table->timestamps();

            $table->index('empleado_id', 'idx_asig_emp');
            $table->index('producto_id', 'idx_asig_prod');
            $table->index('anio', 'idx_asig_anio');
            $table->index(['empleado_id', 'anio'], 'idx_asig_emp_anio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignaciones_vestuario');
    }
};
