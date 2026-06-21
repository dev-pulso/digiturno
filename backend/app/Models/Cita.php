<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cita extends Model
{
    use SoftDeletes;

    protected $table = 'citas';

    protected $fillable = [
        'paciente_id',
        'area_id',
        'fecha',
        'hora',
        'estado',
        'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'metadatos' => 'array',
        ];
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
