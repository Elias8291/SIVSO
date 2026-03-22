<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_tallas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('talla_id')->constrained('tallas')->cascadeOnDelete();
            $table->year('anio');
            $table->string('medidas')->nullable();
            $table->integer('cantidad_disponible')->default(0);
            $table->timestamps();

            $table->unique(['producto_id', 'talla_id', 'anio'], 'prod_talla_anio_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_tallas');
    }
};
