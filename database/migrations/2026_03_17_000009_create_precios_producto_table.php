<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('precios_producto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->integer('anio');
            $table->decimal('precio_unitario', 10, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['producto_id', 'anio'], 'uk_prod_anio');
            $table->index('anio', 'idx_precio_anio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('precios_producto');
    }
};
