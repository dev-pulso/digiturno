<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalDigiturno extends Model
{
    use HasFactory;

    protected $table = 'personal_digiturno';

    protected $fillable = [
        'numero_documento',
        'nombre',
        'rol',
        'area_id_predeterminada',
        'puede_rotar',
        'activo',
    ];

    protected $casts = [
        'puede_rotar' => 'boolean',
        'activo' => 'boolean',
    ];

    public function areaPredeterminada(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_id_predeterminada');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
