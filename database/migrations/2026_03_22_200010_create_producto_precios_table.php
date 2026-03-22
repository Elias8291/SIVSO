<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_precios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->year('anio');
            $table->string('clave', 30);
            $table->decimal('precio_unitario', 12, 2);
            $table->timestamps();

            $table->unique(['producto_id', 'anio'], 'prod_precio_anio_unique');
            $table->index('clave');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_precios');
    }
};
