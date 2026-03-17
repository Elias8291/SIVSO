<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tabla: delegacion
 * Trabajadores y su delegación asignada.
 *
 * La columna "delegacion" guarda la clave CON guión (ej: "3B-101").
 * Para enlazar con la tabla "delegado" (que guarda SIN guión, ej: "3B101"),
 * usar el accessor $trabajador->delegacion_clave o:
 *   Delegado::where('delegacion', str_replace('-', '', $trabajador->delegacion))
 *
 * La columna "ur" (int) referencia "key" (varchar) de la tabla dependences.
 */
class Delegacion extends Model
{
    protected $table = 'delegacion';

    public $timestamps = false;

    protected $fillable = [
        'nombre_trab',
        'apellp_trab',
        'apellm_trab',
        'nue',
        'ur',
        'dependencia',
        'delegacion',
    ];

    /**
     * Dependencia (UR) del trabajador.
     * delegacion.ur = dependences.key
     */
    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class, 'ur', 'key');
    }

    /**
     * Registros de concentrado (vestuario) de este trabajador, por NUE.
     */
    public function concentrados(): HasMany
    {
        return $this->hasMany(Concentrado::class, 'nue', 'nue');
    }

    /**
     * Nombre completo del trabajador.
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre_trab} {$this->apellp_trab} {$this->apellm_trab}");
    }

    /**
     * Clave de delegación sin guión para buscar en la tabla delegado.
     * Ej: "3B-101" → "3B101"
     */
    public function getDelegacionClaveAttribute(): string
    {
        return str_replace('-', '', $this->delegacion ?? '');
    }

    /**
     * Delegado responsable de este trabajador.
     * Se resuelve quitando el guión de delegacion.delegacion.
     */
    public function delegado(): BelongsTo
    {
        return $this->belongsTo(Delegado::class, 'ur', 'ur');
    }
}
