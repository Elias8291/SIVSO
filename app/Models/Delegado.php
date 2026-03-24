<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Delegado extends Model
{
    protected $fillable = ['nombre', 'user_id', 'empleado_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function delegaciones(): BelongsToMany
    {
        return $this->belongsToMany(Delegacion::class, 'delegado_delegacion')
            ->withTimestamps();
    }
}
