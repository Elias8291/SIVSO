<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Tabla: concentrado
 * Registro de vestuario asignado por trabajador y partida.
 *
 * Relación con propuesta:
 *   concentrado.no_partida = propuesta.partida
 *   (Para filtrar además por lote y partida_especifica, agregar esas columnas
 *    a la tabla concentrado según se requiera)
 */
class Concentrado extends Model
{
    protected $table = 'concentrado';

    public $timestamps = false;

    protected $fillable = [
        'nombre_trab',
        'apellp_trab',
        'apellm_trab',
        'nue',
        'ur',
        'dependencia',
        'ur_dependencia',
        'cantidad',
        'clave2025',
        'descripcion',
        'precio_unitario',
        'importe',
        'iva',
        'total',
        'no_partida',
        'partida_descripcion',
        'clave_partida',
        'clave_descripcion_partida',
        'clave_descripcion',
        'talla',
        'cantidad2',
        'clave_presupuestal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'importe'         => 'decimal:2',
        'iva'             => 'decimal:2',
        'total'           => 'decimal:2',
    ];

    /**
     * Dependencia (UR) de este registro.
     * concentrado.ur = dependences.key
     */
    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class, 'ur', 'key');
    }

    /**
     * Datos del trabajador en la tabla delegacion, por NUE.
     */
    public function trabajador(): HasOne
    {
        return $this->hasOne(Delegacion::class, 'nue', 'nue');
    }

    /**
     * Producto de propuesta para esta partida.
     * concentrado.no_partida = propuesta.partida
     */
    public function propuesta(): BelongsTo
    {
        return $this->belongsTo(Propuesta::class, 'no_partida', 'partida');
    }

    /**
     * Nombre completo del trabajador (directo desde concentrado).
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre_trab} {$this->apellp_trab} {$this->apellm_trab}");
    }
}
