<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Presupuesto extends Model
{
    protected $table = 'presupuestos';

    protected $fillable = [
        'dependencia_clave',
        'anio',
        'monto_total',
    ];

    protected function casts(): array
    {
        return [
            'monto_total' => 'decimal:2',
        ];
    }

    public function partidas(): BelongsToMany
    {
        return $this->belongsToMany(
            PartidaPresupuestal::class,
            'presupuesto_partida',
            'presupuesto_id',
            'partida_presupuestal_id'
        )->withPivot('monto');
    }

    public function presupuestoPartidas(): HasMany
    {
        return $this->hasMany(PresupuestoPartida::class);
    }
}
