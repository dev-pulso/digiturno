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

    public function llamar(Turno $turno, ?string $realizadoPor = null): Turno
    {
        Turno::where('area_id', $turno->area_id)
            ->where('estado', EstadoTurno::Llamando)
            ->where('id', '!=', $turno->id)
            ->update(['estado' => EstadoTurno::EnEspera]);

        $turno->update([
            'contador_llamados' => $turno->contador_llamados + 1,
        ]);

        return $this->transicionar($turno, EstadoTurno::Llamando, $realizadoPor);
    }

    public function rellamar(Turno $turno, ?string $realizadoPor = null): Turno
    {
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
        $turno->update([
            'contador_llamados' => 0,
            'estado' => EstadoTurno::EnEspera,
            'created_at' => Carbon::now(),
        ]);

        TurnoLog::create([
            'turno_id' => $turno->id,
            'accion' => 'ausente_a_cola',
            'estado_anterior' => $turno->getOriginal('estado'),
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
