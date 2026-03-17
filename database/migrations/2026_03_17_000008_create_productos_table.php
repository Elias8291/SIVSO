<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partida_presupuestal_id')->constrained('partidas_presupuestales');
            $table->integer('partida');
            $table->integer('partida_especifica');
            $table->integer('lote')->nullable();
            $table->string('codigo', 30)->nullable();
            $table->string('clave_vestuario', 30)->nullable();
            $table->mediumText('descripcion');
            $table->string('marca', 80)->nullable();
            $table->string('unidad', 15)->nullable();
            $table->string('medida', 10)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index('partida_presupuestal_id', 'idx_prod_partida');
            $table->index('clave_vestuario', 'idx_prod_clave');
            $table->index('partida', 'idx_prod_partida_num');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
