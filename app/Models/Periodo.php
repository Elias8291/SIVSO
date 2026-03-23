<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Periodo extends Model
{
    protected $table = 'periodos';

    protected $fillable = [
        'anio',
        'nombre',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'anio'         => 'integer',
            'fecha_inicio' => 'date',
            'fecha_fin'    => 'date',
        ];
    }

    public function estaAbierto(): bool
    {
        return $this->estado === 'abierto';
    }
}
