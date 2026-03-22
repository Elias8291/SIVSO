<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductoTalla extends Model
{
    protected $fillable = [
        'producto_id',
        'talla_id',
        'anio',
        'medidas',
        'cantidad_disponible',
    ];

    protected function casts(): array
    {
        return [
            'anio'                => 'integer',
            'cantidad_disponible' => 'integer',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function talla(): BelongsTo
    {
        return $this->belongsTo(Talla::class);
    }

    public function selecciones(): HasMany
    {
        return $this->hasMany(Seleccion::class);
    }
}
