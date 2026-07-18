<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsaludIngreso extends Model
{
    protected $table = 'consalud_ingresos';

    protected $fillable = [
        'paciente_id',
        'consalud_ingreso_id',
        'ingreso_json',
        'examenes_asignados',
        'turnos_creados',
    ];

    protected function casts(): array
    {
        return [
            'ingreso_json' => 'array',
            'examenes_asignados' => 'array',
            'turnos_creados' => 'array',
        ];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }
}
