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

    public function broadcastOn(): array { return [new Channel('area.' . $this->turno->area_id)]; }
    public function broadcastAs(): string { return 'turno.completado'; }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->turno->id,
            'numero_turno' => $this->turno->numero_turno,
            'nombre_paciente' => $this->turno->nombre_paciente,
            'area_id' => $this->turno->area_id,
            'estado' => $this->turno->estado->value,
        ];
    }
}
