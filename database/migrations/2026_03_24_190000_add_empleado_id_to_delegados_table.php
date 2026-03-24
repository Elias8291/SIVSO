<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delegados', function (Blueprint $table) {
            $table->foreignId('empleado_id')->nullable()->after('user_id')->constrained('empleados')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('delegados', function (Blueprint $table) {
            $table->dropConstrainedForeignId('empleado_id');
        });
    }
};
