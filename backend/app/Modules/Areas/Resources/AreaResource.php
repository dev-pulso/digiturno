<?php

namespace App\Modules\Areas\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'prefijo' => $this->prefijo,
            'color' => $this->color,
            'activo' => $this->activo,
            'turnos_espera' => $this->turnos_espera ?? 0,
            'turno_actual' => $this->relationLoaded('turnoActual') && $this->turnoActual
                ? [
                    'numero_turno' => $this->turnoActual->numero_turno,
                    'nombre_paciente' => $this->turnoActual->nombre_paciente,
                ]
                : null,
            'created_at' => $this->created_at,
        ];
    }
}
