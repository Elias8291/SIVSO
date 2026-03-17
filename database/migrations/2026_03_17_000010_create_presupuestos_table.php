<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presupuestos', function (Blueprint $table) {
            $table->id();
            $table->string('dependencia_clave', 30);
            $table->integer('anio');
            $table->decimal('monto_total', 15, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['dependencia_clave', 'anio'], 'uk_presup_dep_anio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presupuestos');
    }
};
