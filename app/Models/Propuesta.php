<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tabla original: propuesta
 * Contiene los productos/artículos de cada lote y partida.
 *
 * Relación con concentrado:
 *   concentrado.no_partida = propuesta.partida
 *   (lote y partida_especifica se pueden añadir como columnas en concentrado
 *    para afinar la relación cuando se requiera)
 */
class Propuesta extends Model
{
    protected $table = 'propuesta';

    public $timestamps = false;

    protected $fillable = [
        'lote',
        'partida_especifica',
        'partida',
        'descripcion',
        'cantidad',
        'unidad',
        'marca',
        'precio_unitario',
        'subtotal',
        'proveedor',
        'medida',
        'codigo',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    /**
     * Proveedor de este producto.
     * propuesta.proveedor (abreviación) = proveedor.abreviacion
     */
    public function proveedorModel(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor', 'abreviacion');
    }

    /**
     * Registros de concentrado que corresponden a esta partida.
     * concentrado.no_partida = propuesta.partida
     */
    public function concentrados(): HasMany
    {
        return $this->hasMany(Concentrado::class, 'no_partida', 'partida');
    }
}
