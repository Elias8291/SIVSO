<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dependencia extends Model
{
    protected $fillable = ['clave', 'nombre'];

    public function delegaciones(): BelongsToMany
    {
        return $this->belongsToMany(Delegacion::class, 'dependencia_delegacion')
                    ->withTimestamps();
    }

    public function empleados(): HasMany
    {
        return $this->hasMany(Empleado::class);
    }
}
