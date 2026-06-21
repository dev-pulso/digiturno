<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Paciente extends Model
{
    use SoftDeletes;

    protected $table = 'pacientes';

    protected $fillable = [
        'tipo_documento',
        'numero_documento',
        'nombre_completo',
        'telefono',
        'correo',
        'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'metadatos' => 'array',
        ];
    }

    public function turnos(): HasMany
    {
        return $this->hasMany(Turno::class, 'paciente_id');
    }

    public function examenes(): HasMany
    {
        return $this->hasMany(ExamenPaciente::class, 'paciente_id');
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'paciente_id');
    }

    public function scopeBuscarPorDocumento($query, string $documento)
    {
        return $query->where('numero_documento', $documento);
    }
}
