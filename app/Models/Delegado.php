<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tabla: delegado
 * Delegados de cada Unidad Receptora.
 *
 * La columna "delegacion" guarda la clave SIN guión (ej: "3B101").
 * En la tabla "delegacion", el mismo valor se guarda CON guión (ej: "3B-101").
 * Para obtener los trabajadores de un delegado:
 *   Delegacion::whereRaw("REPLACE(delegacion, '-', '') = ?", [$delegado->delegacion])
 */
class Delegado extends Model
{
    protected $table = 'delegado';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'delegacion',
        'ur',
    ];

    /**
     * Dependencia (UR) de este delegado.
     * delegado.ur = dependences.key
     */
    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class, 'ur', 'key');
    }

    /**
     * Trabajadores que pertenecen a la misma UR.
     * (Relación completa via REPLACE requiere consulta manual)
     */
    public function trabajadoresDeLaUr(): HasMany
    {
        return $this->hasMany(Delegacion::class, 'ur', 'ur');
    }
}
