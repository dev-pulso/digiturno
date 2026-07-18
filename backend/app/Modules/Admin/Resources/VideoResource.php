<?php

namespace App\Modules\Admin\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'archivo' => $this->archivo,
            'nombre_original' => $this->nombre_original,
            'tipo_mime' => $this->tipo_mime,
            'tamano' => $this->tamano,
            'duracion' => $this->duracion,
            'orden' => $this->orden,
            'activo' => $this->activo,
            'url' => $this->url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
