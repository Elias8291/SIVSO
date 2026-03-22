<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('pv', 30)->nullable();
            $table->string('rfc', 20)->nullable();
            $table->string('nombre');
            $table->text('direccion')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('abreviacion', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
