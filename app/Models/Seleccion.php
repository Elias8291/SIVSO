<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seleccion extends Model
{
    protected $table = 'selecciones';

    protected $fillable = [
        'empleado_id',
        'producto_talla_id',
        'anio',
        'cantidad',
    ];

    protected function casts(): array
    {
        return [
            'anio'     => 'integer',
            'cantidad' => 'integer',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function productoTalla(): BelongsTo
    {
        return $this->belongsTo(ProductoTalla::class);
    }
}
