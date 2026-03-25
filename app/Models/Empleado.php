<?php

namespace App\Models;

use App\Support\BusquedaTextoSql;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

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

    /**
     * Búsqueda por nombre: varias palabras (cada una debe aparecer en algún campo),
     * y coincidencia insensible a acentos (ej. AVENDANO vs AVENDAÑO).
     */
    public function scopeWhereBusquedaEmpleado(Builder $query, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }

        $tokens = preg_split('/\s+/u', $search, -1, PREG_SPLIT_NO_EMPTY);
        if ($tokens === []) {
            return;
        }

        $query->where(function (Builder $outer) use ($tokens) {
            foreach ($tokens as $token) {
                $outer->where(function (Builder $q) use ($token) {
                    $ascii = Str::ascii($token);
                    $foldPattern = '%'.BusquedaTextoSql::escapeLike(mb_strtoupper($ascii !== '' ? $ascii : $token, 'UTF-8')).'%';

                    $likeT = '%'.BusquedaTextoSql::escapeLike($token).'%';
                    $likeA = ($ascii !== '' && $ascii !== $token) ? '%'.BusquedaTextoSql::escapeLike($ascii).'%' : null;

                    $q->where(function (Builder $q2) use ($likeT, $likeA, $foldPattern) {
                        $q2->where('nue', 'like', $likeT)
                            ->orWhere('nombre', 'like', $likeT)
                            ->orWhere('apellido_paterno', 'like', $likeT)
                            ->orWhere('apellido_materno', 'like', $likeT);
                        if ($likeA !== null) {
                            $q2->orWhere('nue', 'like', $likeA)
                                ->orWhere('nombre', 'like', $likeA)
                                ->orWhere('apellido_paterno', 'like', $likeA)
                                ->orWhere('apellido_materno', 'like', $likeA);
                        }
                        foreach (['nue', 'nombre', 'apellido_paterno', 'apellido_materno'] as $col) {
                            $q2->orWhereRaw(BusquedaTextoSql::sqlSpanishFoldUpper($col).' LIKE ?', [$foldPattern]);
                        }
                    });
                });
            }
        });
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
