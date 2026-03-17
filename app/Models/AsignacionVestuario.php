<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsignacionVestuario extends Model
{
    protected $table = 'asignaciones_vestuario';

    protected $fillable = [
        'empleado_id',
        'producto_id',
        'anio',
        'cantidad',
        'talla',
        'clave_variante',
        'precio_unitario',
        'importe',
    ];

    protected function casts(): array
    {
        return [
            'precio_unitario' => 'decimal:2',
            'importe'         => 'decimal:2',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
