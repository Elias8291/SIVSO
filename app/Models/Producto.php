<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tabla: propuesta (legacy, en bas_vestuario)
 * Catálogo de artículos de vestuario.
 */
class Producto extends Model
{
    protected $table = 'propuesta';

    public $timestamps = false;

    protected $fillable = [
        'lote', 'partida_especifica', 'partida',
        'descripcion', 'cantidad', 'unidad', 'marca',
        'precio_unitario', 'subtotal', 'proveedor', 'medida', 'codigo',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal'        => 'decimal:2',
    ];

    public function proveedorModel(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor', 'abreviacion');
    }
}
