<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla: proveedor (bas_vestuario)
 * Catálogo de proveedores.
 * propuesta.proveedor = proveedor.abreviacion
 */
return new class extends Migration
{
    protected $connection = 'bas_vestuario';

    public function up(): void
    {
        Schema::connection($this->connection)->create('proveedor', function (Blueprint $table) {
            $table->id();
            $table->string('pv')->nullable();
            $table->string('rfc')->nullable();
            $table->string('proveedor')->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('abreviacion')->nullable()->comment('Referenciado por propuesta.proveedor');
            $table->string('numero')->nullable();
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('proveedor');
    }
};
