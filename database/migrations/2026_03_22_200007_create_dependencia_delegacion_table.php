<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dependencia_delegacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dependencia_id')->constrained('dependencias')->cascadeOnDelete();
            $table->foreignId('delegacion_id')->constrained('delegaciones')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['dependencia_id', 'delegacion_id'], 'dep_del_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dependencia_delegacion');
    }
};
