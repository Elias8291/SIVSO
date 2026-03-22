<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    protected $fillable = [
        'nue',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'dependencia_id',
        'delegacion_id',
        'user_id',
    ];

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellido_paterno} {$this->apellido_materno}");
    }

    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class);
    }

    public function delegacion(): BelongsTo
    {
        return $this->belongsTo(Delegacion::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function selecciones(): HasMany
    {
        return $this->hasMany(Seleccion::class);
    }
}
