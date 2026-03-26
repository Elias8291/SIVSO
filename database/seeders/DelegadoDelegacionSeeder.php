<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\ImportsCsv;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DelegadoDelegacionSeeder extends Seeder
{
    use ImportsCsv;

    public function run(): void
    {
        // Import is intentionally idempotent: allow re-running after fixing CSV mappings.
        $this->importCsv('delegado_delegacion', 'delegado_delegacion', ignoreDuplicates: true);

        // El CSV original no incluye `ur`, pero en la base original (concent_p.delegado) sí existe.
        // Para que los filtros por UR coincidan, rellenamos `delegado_delegacion.ur` desde el legacy.
        if (Schema::hasColumn('delegado_delegacion', 'ur') && Schema::hasTable('concent_p.delegado')) {
            DB::statement(
                'UPDATE delegado_delegacion dd
                 JOIN delegaciones dl ON dl.id = dd.delegacion_id
                 JOIN concent_p.delegado d ON d.id = dd.delegado_id AND d.delegacion = dl.clave
                 SET dd.ur = d.ur'
            );
        }
    }
}
