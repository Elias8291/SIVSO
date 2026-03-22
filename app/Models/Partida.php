<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partida extends Model
{
    protected $fillable = ['numero', 'descripcion'];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class);
    }
}
