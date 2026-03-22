<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Talla extends Model
{
    protected $fillable = ['nombre'];

    public function productoTallas(): HasMany
    {
        return $this->hasMany(ProductoTalla::class);
    }
}
