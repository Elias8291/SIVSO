<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: propuesta (bas_vestuario)
 * Catálogo de productos/artículos de vestuario por lote y partida.
 * concentrado.no_partida = propuesta.id (según ImportOriginalDataSeeder)
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('propuesta', function (Blueprint $table) {
            $table->id();
            $table->string('partida')->nullable();
            $table->string('partida_especifica')->nullable();
            $table->string('lote')->nullable();
            $table->string('descripcion')->nullable();
            $table->decimal('cantidad', 12, 2)->nullable();
            $table->string('unidad')->nullable();
            $table->string('marca')->nullable();
            $table->decimal('precio_unitario', 12, 2)->nullable();
            $table->decimal('subtotal', 12, 2)->nullable();
            $table->string('proveedor')->nullable()->comment('proveedor.abreviacion');
            $table->string('medida')->nullable();
            $table->string('codigo')->nullable()->comment('Clave vestuario / clave2025');

            $table->index(['partida', 'partida_especifica', 'lote']);
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('propuesta');
    }
};
