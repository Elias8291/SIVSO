<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoActualizacion extends Model
{
    protected $table = 'periodos_actualizacion';

    protected $fillable = [
        'anio',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin'    => 'date',
            'activo'       => 'boolean',
        ];
    }

    public function estaActivo(): bool
    {
        $hoy = now()->toDateString();

        return $this->activo
            && $this->fecha_inicio->toDateString() <= $hoy
            && $this->fecha_fin->toDateString() >= $hoy;
    }
}
