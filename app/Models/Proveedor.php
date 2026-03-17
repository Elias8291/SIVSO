<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tabla original: proveedor
 */
class Proveedor extends Model
{
    protected $table = 'proveedor';

    public $timestamps = false;

    protected $fillable = [
        'pv',
        'rfc',
        'proveedor',
        'direccion',
        'telefono',
        'abreviacion',
        'numero',
    ];

    /**
     * Productos (propuesta) de este proveedor.
     * proveedor.abreviacion = propuesta.proveedor
     */
    public function propuestas(): HasMany
    {
        return $this->hasMany(Propuesta::class, 'proveedor', 'abreviacion');
    }
}
