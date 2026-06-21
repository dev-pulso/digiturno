<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = [
        'codigo',
        'nombre',
        'prefijo',
        'color',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function turnos(): HasMany
    {
        return $this->hasMany(Turno::class);
    }

    public function tiposExamenes(): HasMany
    {
        return $this->hasMany(TipoExamen::class);
    }

    public function turnoActual()
    {
        return $this->hasOne(Turno::class)->where('estado', 'llamando');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
