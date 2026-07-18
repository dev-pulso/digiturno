<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsaludCategoriaArea extends Model
{
    protected $table = 'consalud_categorias_areas';

    protected $fillable = [
        'categoria_exam_id',
        'area_id',
        'tipo_examen_id',
        'nombre',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
