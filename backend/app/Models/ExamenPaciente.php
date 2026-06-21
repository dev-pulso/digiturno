<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\EstadoExamenPaciente;

class ExamenPaciente extends Model
{
    protected $table = 'examenes_pacientes';

    protected $fillable = [
        'paciente_id',
        'tipo_examen_id',
        'estado',
        'turno_id',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoExamenPaciente::class,
        ];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }

    public function tipoExamen(): BelongsTo
    {
        return $this->belongsTo(TipoExamen::class, 'tipo_examen_id');
    }

    public function turno(): BelongsTo
    {
        return $this->belongsTo(Turno::class, 'turno_id');
    }

    public function scopePendiente($query)
    {
        return $query->where('estado', EstadoExamenPaciente::Pendiente);
    }

    public function scopeEnCola($query)
    {
        return $query->where('estado', EstadoExamenPaciente::EnCola);
    }
}
