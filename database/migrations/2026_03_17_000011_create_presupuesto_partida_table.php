<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presupuesto_partida', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presupuesto_id')->constrained('presupuestos')->cascadeOnDelete();
            $table->foreignId('partida_presupuestal_id')->constrained('partidas_presupuestales');
            $table->decimal('monto', 15, 2)->default(0.00);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['presupuesto_id', 'partida_presupuestal_id'], 'uk_presup_pp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presupuesto_partida');
    }
};
