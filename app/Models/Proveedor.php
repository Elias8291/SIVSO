<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = ['pv', 'rfc', 'nombre', 'direccion', 'telefono', 'abreviacion'];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class);
    }
}
