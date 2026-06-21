<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Enums\EstadoTurno;
use App\Enums\OrigenTurno;

class Turno extends Model
{
    protected $table = 'turnos';

    protected $fillable = [
        'numero_turno',
        'area_id',
        'paciente_id',
        'examen_paciente_id',
        'nombre_paciente',
        'estado',
        'origen',
        'llamado_por',
        'llamado_en',
        'completado_en',
        'ausente_en',
        'contador_llamados',
        'segundos_espera',
        'segundos_servicio',
        'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoTurno::class,
            'origen' => OrigenTurno::class,
            'llamado_en' => 'datetime',
            'completado_en' => 'datetime',
            'ausente_en' => 'datetime',
            'metadatos' => 'array',
            'segundos_espera' => 'integer',
            'segundos_servicio' => 'integer',
            'contador_llamados' => 'integer',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }

    public function examenPaciente(): BelongsTo
    {
        return $this->belongsTo(ExamenPaciente::class, 'examen_paciente_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(TurnoLog::class, 'turno_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'turno_id');
    }

    public function scopePorArea($query, $areaId)
    {
        return $query->where('area_id', $areaId);
    }

    public function scopePorEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    public function scopeEnEspera($query)
    {
        return $query->where('estado', EstadoTurno::EnEspera);
    }

    public function scopeHoy($query)
    {
        return $query->whereDate('created_at', today());
    }
}
