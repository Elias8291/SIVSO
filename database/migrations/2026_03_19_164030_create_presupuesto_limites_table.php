<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('presupuesto_limites', function (Blueprint $table) {
            $table->id();
            $table->string('ur', 10);
            $table->integer('partida_especifica');
            $table->decimal('limite', 15, 2)->default(0);
            $table->smallInteger('anio');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presupuesto_limites');
    }
};
