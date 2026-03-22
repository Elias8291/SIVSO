<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegado_delegacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delegado_id')->constrained('delegados')->cascadeOnDelete();
            $table->foreignId('delegacion_id')->constrained('delegaciones')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['delegado_id', 'delegacion_id'], 'dlg_del_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegado_delegacion');
    }
};
