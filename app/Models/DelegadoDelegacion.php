<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DelegadoDelegacion extends Model
{
    protected $table = 'delegado_delegacion';

    public $timestamps = false;

    protected $fillable = [
        'delegado_id',
        'delegacion_clave',
        'dependencia_clave',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_fin'    => 'datetime',
            'activo'       => 'boolean',
        ];
    }

    public function delegado(): BelongsTo
    {
        return $this->belongsTo(Delegado::class);
    }
}
