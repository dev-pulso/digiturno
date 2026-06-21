<?php

namespace App\Services;

use App\Models\Area;
use App\Models\ExamenPaciente;
use App\Models\Paciente;
use App\Models\Turno;
use App\Enums\EstadoExamenPaciente;
use App\Enums\EstadoTurno;
use App\Enums\OrigenTurno;
use App\Events\TurnoCreado;
use Illuminate\Support\Facades\DB;

class ServicioExamenesPacientes
{
    public function __construct(
        private GeneradorNumeroTurno $generadorNumero,
    ) {}

    public function asignarExamenes(int $pacienteId, array $tiposExamenesIds): array
    {
        $creados = [];

        foreach ($tiposExamenesIds as $tipoExamenId) {
            $examen = ExamenPaciente::firstOrCreate(
                [
                    'paciente_id' => $pacienteId,
                    'tipo_examen_id' => $tipoExamenId,
                ],
                [
                    'estado' => EstadoExamenPaciente::Pendiente,
                ]
            );
            $creados[] = $examen;
        }

        if (!empty($creados)) {
            $this->autoEncolarPaciente($pacienteId);
        }

        return $creados;
    }

    public function autoEncolarPaciente(int $pacienteId): ?Turno
    {
        $paciente = Paciente::findOrFail($pacienteId);

        $examenesPendientes = ExamenPaciente::where('paciente_id', $pacienteId)
            ->where('estado', EstadoExamenPaciente::Pendiente)
            ->with('tipoExamen.area')
            ->get();

        if ($examenesPendientes->isEmpty()) {
            return null;
        }

        $areasPendientes = $examenesPendientes
            ->pluck('tipoExamen.area')
            ->unique('id')
            ->filter(fn($a) => $a && $a->activo);

        if ($areasPendientes->isEmpty()) {
            return null;
        }

        $areaElegida = $areasPendientes
            ->sortBy(fn(Area $a) => Turno::where('area_id', $a->id)
                ->where('estado', EstadoTurno::EnEspera)
                ->count()
            )
            ->first();

        $examenElegido = $examenesPendientes
            ->firstWhere('tipoExamen.area_id', $areaElegida->id);

        $turno = DB::transaction(function () use ($paciente, $areaElegida, $examenElegido) {
            $numeroTurno = $this->generadorNumero->generar($areaElegida);

            $turno = Turno::create([
                'numero_turno' => $numeroTurno,
                'area_id' => $areaElegida->id,
                'paciente_id' => $paciente->id,
                'nombre_paciente' => $paciente->nombre_completo,
                'estado' => EstadoTurno::EnEspera,
                'origen' => OrigenTurno::Recepcion,
            ]);

            $examenElegido->update([
                'estado' => EstadoExamenPaciente::EnCola,
                'turno_id' => $turno->id,
            ]);

            $turno->update(['examen_paciente_id' => $examenElegido->id]);

            return $turno;
        });

        $turno->load('area', 'examenPaciente.tipoExamen');

        try {
            broadcast(new TurnoCreado($turno));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast fallido: ' . $e->getMessage());
        }

        return $turno;
    }

    public function completarYAvanzar(Turno $turno): void
    {
        if ($turno->examen_paciente_id) {
            $examen = ExamenPaciente::find($turno->examen_paciente_id);
            if ($examen) {
                $examen->update(['estado' => EstadoExamenPaciente::Completado]);
            }
        }

        if ($turno->paciente_id) {
            $this->autoEncolarPaciente($turno->paciente_id);
        }
    }
}
