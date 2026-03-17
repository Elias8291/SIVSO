<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartidaPresupuestal extends Model
{
    protected $table = 'partidas_presupuestales';

    protected $fillable = [
        'partida',
        'partida_especifica',
        'lote',
        'descripcion',
        'clave_partida',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class);
    }

    public function presupuestos(): BelongsToMany
    {
        return $this->belongsToMany(
            Presupuesto::class,
            'presupuesto_partida',
            'partida_presupuestal_id',
            'presupuesto_id'
        )->withPivot('monto');
    }
}
