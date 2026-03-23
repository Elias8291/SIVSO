<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $table = 'notificaciones';

    protected $fillable = [
        'user_id',
        'titulo',
        'mensaje',
        'tipo',
        'enlace',
        'leida_en',
    ];

    protected function casts(): array
    {
        return [
            'leida_en' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeNoLeidas($query)
    {
        return $query->whereNull('leida_en');
    }

    public function scopeLeidas($query)
    {
        return $query->whereNotNull('leida_en');
    }

    public function marcarLeida(): void
    {
        $this->update(['leida_en' => now()]);
    }
}
