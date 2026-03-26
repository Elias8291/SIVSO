<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delegado_delegacion', function (Blueprint $table) {
            // En la base original (concent_p.delegado) el campo `ur` pertenece al vínculo
            // delegado-delegación, por eso se guarda en el pivote.
            $table->string('ur', 5)->nullable()->after('delegacion_id');
        });
    }

    public function down(): void
    {
        Schema::table('delegado_delegacion', function (Blueprint $table) {
            $table->dropColumn('ur');
        });
    }
};

