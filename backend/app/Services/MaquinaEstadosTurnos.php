<?php

namespace App\Services;

use App\Models\Turno;
use App\Models\TurnoLog;
use App\Enums\EstadoTurno;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class MaquinaEstadosTurnos
{
    public function puedeTransicionar(Turno $turno, EstadoTurno $nuevoEstado): bool
    {
        $permitidos = EstadoTurno::transiciones()[$turno->estado->value] ?? [];
        return in_array($nuevoEstado, $permitidos);
    }

    public function transicionar(Turno $turno, EstadoTurno $nuevoEstado, ?string $realizadoPor = null): Turno
    {
        if (!$this->puedeTransicionar($turno, $nuevoEstado)) {
            throw ValidationException::withMessages([
                'estado' => "No se puede cambiar de {$turno->estado->etiqueta()} a {$nuevoEstado->etiqueta()}",
            ]);
        }

        $estadoAnterior = $turno->estado;

        $marcasTiempo = [
            EstadoTurno::Llamando->value => ['llamado_en' => Carbon::now()],
            EstadoTurno::Completado->value => ['completado_en' => Carbon::now()],
            EstadoTurno::Ausente->value => ['ausente_en' => Carbon::now()],
        ];

        $actualizaciones = ['estado' => $nuevoEstado] + ($marcasTiempo[$nuevoEstado->value] ?? []);
        $actualizaciones['llamado_por'] = $realizadoPor;

        $turno->update($actualizaciones);

        TurnoLog::create([
            'turno_id' => $turno->id,
            'accion' => $nuevoEstado->value,
            'estado_anterior' => $estadoAnterior->value,
            'estado_nuevo' => $nuevoEstado->value,
            'realizado_por' => $realizadoPor,
        ]);

        if ($nuevoEstado === EstadoTurno::Llamando && $turno->llamado_en) {
            $turno->update([
                'segundos_espera' => $turno->created_at->diffInSeconds($turno->llamado_en),
            ]);
        }

        if ($nuevoEstado === EstadoTurno::Completado && $turno->completado_en && $turno->llamado_en) {
            $turno->update([
                'segundos_servicio' => $turno->llamado_en->diffInSeconds($turno->completado_en),
            ]);
        }

        return $turno->fresh();
    }

    public function verificarPacienteDisponible(Turno $turno): void
    {
        if (!$turno->paciente_id) {
            return;
        }

        $ocupado = Turno::turnoEnAtencionDePaciente($turno->paciente_id, $turno->id);

        if ($ocupado && $ocupado->area_id !== $turno->area_id) {
            throw ValidationException::withMessages([
                'paciente' => "El paciente ya está siendo atendido en {$ocupado->area->nombre}",
            ]);
        }
    }

    public function llamar(Turno $turno, ?string $realizadoPor = null): Turno
    {
        $this->verificarPacienteDisponible($turno);

        $otrosLlamando = Turno::where('area_id', $turno->area_id)
            ->where('estado', EstadoTurno::Llamando)
            ->where('id', '!=', $turno->id)
            ->get();

        foreach ($otrosLlamando as $otro) {
            if ($otro->created_at->isToday()) {
                $otro->update(['estado' => EstadoTurno::EnEspera]);
            } else {
                $otro->update([
                    'estado' => EstadoTurno::Completado,
                    'completado_en' => Carbon::now(),
                ]);
                TurnoLog::create([
                    'turno_id' => $otro->id,
                    'accion' => 'completado_auto',
                    'estado_anterior' => EstadoTurno::Llamando->value,
                    'estado_nuevo' => EstadoTurno::Completado->value,
                    'realizado_por' => 'sistema',
                ]);
            }
        }

        $turno->update([
            'contador_llamados' => $turno->contador_llamados + 1,
        ]);

        return $this->transicionar($turno, EstadoTurno::Llamando, $realizadoPor);
    }

    public function rellamar(Turno $turno, ?string $realizadoPor = null): Turno
    {
        $this->verificarPacienteDisponible($turno);

        $turno->update([
            'contador_llamados' => $turno->contador_llamados + 1,
        ]);

        return $this->transicionar($turno, EstadoTurno::Llamando, $realizadoPor);
    }

    public function completar(Turno $turno, ?string $realizadoPor = null): Turno
    {
        return $this->transicionar($turno, EstadoTurno::Completado, $realizadoPor);
    }

    public function ausente(Turno $turno, ?string $realizadoPor = null): Turno
    {
        $estadoAnterior = $turno->estado->value;

        $ausenciasPrevias = TurnoLog::where('turno_id', $turno->id)
            ->where('accion', 'ausente_a_cola')
            ->count();

        $posicionDestino = match ($ausenciasPrevias) {
            0 => 3,
            1 => 4,
            2 => 5,
            default => null,
        };

        $turno->contador_llamados = 0;
        $turno->estado = EstadoTurno::EnEspera;

        if ($posicionDestino === null) {
            $turno->created_at = Carbon::now();
        } else {
            $cola = Turno::where('area_id', $turno->area_id)
                ->where('estado', EstadoTurno::EnEspera)
                ->where('id', '!=', $turno->id)
                ->orderBy('created_at')
                ->get();

            $indiceReferencia = $posicionDestino - 2;

            if ($cola->count() > $indiceReferencia) {
                $referencia = $cola[$indiceReferencia];
                $turno->created_at = Carbon::parse($referencia->created_at)->addSecond();
            } else {
                $turno->created_at = Carbon::now();
            }
        }

        $turno->save();

        TurnoLog::create([
            'turno_id' => $turno->id,
            'accion' => 'ausente_a_cola',
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => EstadoTurno::EnEspera->value,
            'realizado_por' => $realizadoPor,
        ]);

        return $turno->fresh();
    }

    public function cancelar(Turno $turno, ?string $realizadoPor = null): Turno
    {
        return $this->transicionar($turno, EstadoTurno::Cancelado, $realizadoPor);
    }
}
