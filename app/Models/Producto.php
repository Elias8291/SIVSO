<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $fillable = [
        'descripcion',
        'unidad',
        'marca',
        'lote',
        'medida',
        'codigo',
        'proveedor_id',
        'partida_id',
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function partida(): BelongsTo
    {
        return $this->belongsTo(Partida::class);
    }

    public function precios(): HasMany
    {
        return $this->hasMany(ProductoPrecio::class);
    }

    public function productoTallas(): HasMany
    {
        return $this->hasMany(ProductoTalla::class);
    }
}
