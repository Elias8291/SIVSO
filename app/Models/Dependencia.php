<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tabla: dependences
 * Unidades Receptoras (UR).
 * La columna "key" (varchar 5) es el identificador que usan las demás tablas
 * en su columna "ur" (int) para referenciar la dependencia.
 */
class Dependencia extends Model
{
    protected $table = 'dependences';

    protected $fillable = [
        'key',
        'name',
    ];

    /**
     * Delegados de esta UR.
     * delegado.ur = dependences.key
     */
    public function delegados(): HasMany
    {
        return $this->hasMany(Delegado::class, 'ur', 'key');
    }

    /**
     * Trabajadores de esta UR (tabla delegacion).
     * delegacion.ur = dependences.key
     */
    public function trabajadores(): HasMany
    {
        return $this->hasMany(Delegacion::class, 'ur', 'key');
    }

    /**
     * Registros de concentrado de esta UR.
     * concentrado.ur = dependences.key
     */
    public function concentrados(): HasMany
    {
        return $this->hasMany(Concentrado::class, 'ur', 'key');
    }
}
