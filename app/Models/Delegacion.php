<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Delegacion extends Model
{
    protected $table = 'delegaciones';

    protected $fillable = ['clave', 'nombre'];

    public function dependencias(): BelongsToMany
    {
        return $this->belongsToMany(Dependencia::class, 'dependencia_delegacion')
                    ->withTimestamps();
    }

    public function delegados(): BelongsToMany
    {
        return $this->belongsToMany(Delegado::class, 'delegado_delegacion')
                    ->withTimestamps();
    }

    public function empleados(): HasMany
    {
        return $this->hasMany(Empleado::class);
    }
}
