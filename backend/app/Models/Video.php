<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'titulo', 'archivo', 'nombre_original', 'tipo_mime',
        'tamano', 'duracion', 'orden', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'tamano' => 'integer',
            'duracion' => 'integer',
            'orden' => 'integer',
            'activo' => 'boolean',
        ];
    }

    public function scopeActivo($query) { return $query->where('activo', true); }
    public function scopeOrdenado($query) { return $query->orderBy('orden'); }

    public function getUrlAttribute(): string
    {
        return asset('storage/videos/' . $this->archivo);
    }
}
