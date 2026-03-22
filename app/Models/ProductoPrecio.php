<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductoPrecio extends Model
{
    protected $fillable = [
        'producto_id',
        'anio',
        'clave',
        'precio_unitario',
    ];

    protected function casts(): array
    {
        return [
            'anio'            => 'integer',
            'precio_unitario' => 'decimal:2',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
