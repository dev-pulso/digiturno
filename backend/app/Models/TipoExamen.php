<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TipoExamen extends Model
{
    protected $table = 'tipos_examenes';

    protected $fillable = [
        'nombre',
        'codigo',
        'area_id',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function examenesPacientes()
    {
        return $this->hasMany(ExamenPaciente::class, 'tipo_examen_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
