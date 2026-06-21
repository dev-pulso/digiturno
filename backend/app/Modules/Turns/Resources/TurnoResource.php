<?php

namespace App\Modules\Turns\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TurnoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_turno' => $this->numero_turno,
            'area_id' => $this->area_id,
            'paciente_id' => $this->paciente_id,
            'examen_paciente_id' => $this->examen_paciente_id,
            'nombre_paciente' => $this->nombre_paciente,
            'estado' => $this->estado->value,
            'estado_etiqueta' => $this->estado->etiqueta(),
            'origen' => $this->origen->value,
            'llamado_por' => $this->llamado_por,
            'llamado_en' => $this->llamado_en,
            'completado_en' => $this->completado_en,
            'ausente_en' => $this->ausente_en,
            'contador_llamados' => $this->contador_llamados,
            'segundos_espera' => $this->segundos_espera,
            'segundos_servicio' => $this->segundos_servicio,
            'created_at' => $this->created_at,
            'area' => $this->whenLoaded('area', fn() => [
                'id' => $this->area->id,
                'codigo' => $this->area->codigo,
                'nombre' => $this->area->nombre,
                'color' => $this->area->color,
                'prefijo' => $this->area->prefijo,
            ]),
            'examen_paciente' => $this->whenLoaded('examenPaciente', fn() => [
                'id' => $this->examenPaciente->id,
                'estado' => $this->examenPaciente->estado->value,
                'tipo_examen' => $this->when($this->examenPaciente->relationLoaded('tipoExamen'), fn() => [
                    'id' => $this->examenPaciente->tipoExamen->id,
                    'nombre' => $this->examenPaciente->tipoExamen->nombre,
                    'codigo' => $this->examenPaciente->tipoExamen->codigo,
                ]),
            ]),
        ];
    }
}
