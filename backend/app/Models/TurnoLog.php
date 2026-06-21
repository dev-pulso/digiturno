<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TurnoLog extends Model
{
    protected $table = 'turnos_logs';

    protected $fillable = [
        'turno_id',
        'accion',
        'estado_anterior',
        'estado_nuevo',
        'realizado_por',
        'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'metadatos' => 'array',
        ];
    }

    public function turno(): BelongsTo
    {
        return $this->belongsTo(Turno::class, 'turno_id');
    }
}
