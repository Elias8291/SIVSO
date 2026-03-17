<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partidas_presupuestales', function (Blueprint $table) {
            $table->id();
            $table->integer('partida');
            $table->integer('partida_especifica');
            $table->integer('lote');
            $table->text('descripcion')->nullable();
            $table->string('clave_partida', 50)->nullable();
            $table->timestamps();

            $table->unique(['partida', 'partida_especifica', 'lote'], 'uk_partida_lote');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partidas_presupuestales');
    }
};
