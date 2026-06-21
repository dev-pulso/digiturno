<?php

namespace App\Modules\Turns\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TurnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'turn_number' => $this->turn_number,
            'area_id' => $this->area_id,
            'patient_id' => $this->patient_id,
            'ventanilla_id' => $this->ventanilla_id,
            'patient_name' => $this->patient_name,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'source' => $this->source->value,
            'called_by' => $this->called_by,
            'called_at' => $this->called_at,
            'completed_at' => $this->completed_at,
            'no_show_at' => $this->no_show_at,
            'wait_seconds' => $this->wait_seconds,
            'service_seconds' => $this->service_seconds,
            'created_at' => $this->created_at,
            'area' => $this->whenLoaded('area', fn() => [
                'id' => $this->area->id,
                'code' => $this->area->code,
                'name' => $this->area->name,
                'color' => $this->area->color,
            ]),
        ];
    }
}
