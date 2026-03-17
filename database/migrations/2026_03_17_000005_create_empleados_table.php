<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empleados', function (Blueprint $table) {
            $table->id();
            $table->string('nue', 15)->comment('Numero Unico de Empleado');
            $table->string('nombre', 80)->nullable();
            $table->string('apellido_paterno', 80)->nullable();
            $table->string('apellido_materno', 80)->nullable();
            $table->string('delegacion_clave', 30)->comment('Clave sin guion');
            $table->string('dependencia_clave', 30);
            $table->boolean('activo')->default(true);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['nue', 'delegacion_clave'], 'uk_emp_nue_delegacion');
            $table->index(['delegacion_clave', 'dependencia_clave'], 'idx_emp_delegacion');
            $table->index('activo', 'idx_emp_activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empleados');
    }
};
