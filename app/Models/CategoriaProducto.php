<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaProducto extends Model
{
    protected $table = 'categorias_producto';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
    ];
}
