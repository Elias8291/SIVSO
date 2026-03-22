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
            $table->text('descripcion');
            $table->string('unidad', 50)->nullable();
            $table->string('marca')->nullable();
            $table->string('lote')->nullable();
            $table->string('medida', 10)->nullable();
            $table->string('codigo', 30)->nullable();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->foreignId('partida_id')->constrained('partidas')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
