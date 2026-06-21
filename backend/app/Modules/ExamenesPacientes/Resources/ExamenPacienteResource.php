<?php

namespace App\Modules\ExamenesPacientes\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamenPacienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'paciente_id' => $this->paciente_id,
            'tipo_examen_id' => $this->tipo_examen_id,
            'estado' => $this->estado->value,
            'estado_etiqueta' => $this->estado->etiqueta(),
            'turno_id' => $this->turno_id,
            'tipo_examen' => $this->whenLoaded('tipoExamen', fn() => [
                'id' => $this->tipoExamen->id,
                'nombre' => $this->tipoExamen->nombre,
                'codigo' => $this->tipoExamen->codigo,
                'area' => $this->when($this->tipoExamen->relationLoaded('area'), fn() => [
                    'id' => $this->tipoExamen->area->id,
                    'nombre' => $this->tipoExamen->area->nombre,
                    'prefijo' => $this->tipoExamen->area->prefijo,
                ]),
            ]),
            'turno' => $this->whenLoaded('turno', fn() => [
                'id' => $this->turno->id,
                'numero_turno' => $this->turno->numero_turno,
                'estado' => $this->turno->estado->value,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
