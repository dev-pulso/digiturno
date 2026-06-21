<?php

namespace App\Modules\TiposExamenes\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TipoExamenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'codigo' => $this->codigo,
            'area_id' => $this->area_id,
            'activo' => $this->activo,
            'area' => $this->whenLoaded('area', fn() => [
                'id' => $this->area->id,
                'nombre' => $this->area->nombre,
                'prefijo' => $this->area->prefijo,
                'color' => $this->area->color,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
