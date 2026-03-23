<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Sincroniza permisos y asignación a roles (misma lógica que RolesPermissionsSeeder).
     */
    public function up(): void
    {
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\RolesPermissionsSeeder',
            '--force' => true,
        ]);
    }

    public function down(): void
    {
        // No revertimos asignaciones de negocio automáticamente.
    }
};
