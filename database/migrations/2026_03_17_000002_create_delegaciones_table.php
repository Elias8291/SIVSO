<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegaciones', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 30)->comment('Clave sin guion');
            $table->string('dependencia_clave', 30);
            $table->string('nombre', 80)->nullable();
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->unique(['clave', 'dependencia_clave'], 'uk_delegacion_clave_dep');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegaciones');
    }
};
