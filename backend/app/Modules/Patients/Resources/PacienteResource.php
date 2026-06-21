<?php

namespace App\Modules\Patients\Resources;

use App\Modules\ExamenesPacientes\Resources\ExamenPacienteResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PacienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tipo_documento' => $this->tipo_documento,
            'numero_documento' => $this->numero_documento,
            'nombre_completo' => $this->nombre_completo,
            'telefono' => $this->telefono,
            'correo' => $this->correo,
            'examenes' => $this->whenLoaded('examenes', fn() => ExamenPacienteResource::collection($this->examenes)),
            'created_at' => $this->created_at,
        ];
    }
}
