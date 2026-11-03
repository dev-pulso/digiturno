<?php

namespace App\Events;

use App\Models\Turno;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TurnoCompletado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Turno $turno) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('area.' . $this->turno->area_id),
            new Channel('display'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'turno.completado';
    }

    public function broadcastWith(): array
    {
        $this->turno->loadMissing(['area', 'examenPaciente.tipoExamen']);

        $examenesNombres = (!empty($this->turno->metadatos['examenes_nombres']) && is_array($this->turno->metadatos['examenes_nombres']))
            ? $this->turno->metadatos['examenes_nombres']
            : ($this->turno->examenPaciente?->tipoExamen?->nombre ? [$this->turno->examenPaciente->tipoExamen->nombre] : null);

        return [
            'id' => $this->turno->id,
            'numero_turno' => $this->turno->numero_turno,
            'nombre_paciente' => $this->turno->nombre_paciente,
            'area_id' => $this->turno->area_id,
            'estado' => $this->turno->estado->value,
            'contador_llamados' => $this->turno->contador_llamados,
            'examenes_nombres' => $examenesNombres,
            'area' => $this->turno->area ? [
                'id' => $this->turno->area->id,
                'codigo' => $this->turno->area->codigo,
                'nombre' => $this->turno->area->nombre,
                'prefijo' => $this->turno->area->prefijo,
                'color' => $this->turno->area->color,
            ] : null,
            'examen_paciente' => $this->turno->examenPaciente ? [
                'id' => $this->turno->examenPaciente->id,
                'tipo_examen' => $this->turno->examenPaciente->tipoExamen ? [
                    'id' => $this->turno->examenPaciente->tipoExamen->id,
                    'nombre' => $this->turno->examenPaciente->tipoExamen->nombre,
                ] : null,
            ] : null,
        ];
    }
}
