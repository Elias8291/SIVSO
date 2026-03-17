<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegado_delegacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delegado_id')->constrained('delegados')->cascadeOnDelete();
            $table->string('delegacion_clave', 30)->comment('Clave sin guion');
            $table->string('dependencia_clave', 30);
            $table->timestamp('fecha_inicio')->useCurrent();
            $table->timestamp('fecha_fin')->nullable();
            $table->boolean('activo')->default(true);

            $table->unique(['delegado_id', 'delegacion_clave', 'dependencia_clave'], 'uk_deleg_del');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegado_delegacion');
    }
};
