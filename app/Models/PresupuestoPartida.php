<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresupuestoPartida extends Model
{
    protected $table = 'presupuesto_partida';

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'presupuesto_id',
        'partida_presupuestal_id',
        'monto',
    ];

    protected function casts(): array
    {
        return [
            'monto'      => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function presupuesto(): BelongsTo
    {
        return $this->belongsTo(Presupuesto::class);
    }

    public function partidaPresupuestal(): BelongsTo
    {
        return $this->belongsTo(PartidaPresupuestal::class);
    }
}
