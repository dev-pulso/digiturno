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

    public function asignarExamenes(int $pacienteId, array $tiposExamenesIds, ?int $consaludIngresoId = null): array
    {
        $creados = [];

        foreach ($tiposExamenesIds as $tipoExamenId) {
            $examen = ExamenPaciente::firstOrCreate(
                [
                    'paciente_id' => $pacienteId,
                    'consalud_ingreso_id' => $consaludIngresoId,
                    'tipo_examen_id' => $tipoExamenId,
                ],
                [
                    'estado' => EstadoExamenPaciente::Pendiente,
                ]
            );
            $creados[] = $examen;
        }

        if (!empty($creados)) {
            $this->autoEncolarPaciente($pacienteId, $consaludIngresoId);
        }

        return $creados;
    }

    public function autoEncolarPaciente(int $pacienteId, ?int $consaludIngresoId = null): ?Turno
    {
        $paciente = Paciente::findOrFail($pacienteId);

        // Anti-duplicado: si el paciente ya tiene un turno en espera o llamando hoy en cualquier área,
        // retornarlo para garantizar un único turno activo a la vez.
        $turnoActivo = Turno::where('paciente_id', $pacienteId)
            ->whereIn('estado', [EstadoTurno::EnEspera, EstadoTurno::Llamando])
            ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
            ->first();

        if ($turnoActivo) {
            return $turnoActivo;
        }

        $query = ExamenPaciente::where('paciente_id', $pacienteId)
            ->where('estado', EstadoExamenPaciente::Pendiente)
            ->with('tipoExamen.area');

        if ($consaludIngresoId !== null) {
            $query->where('consalud_ingreso_id', $consaludIngresoId);
        } else {
            $query->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()]);
        }

        $examenesPendientes = $query->get();

        if ($examenesPendientes->isEmpty()) {
            return null;
        }

        $areasPendientes = $examenesPendientes
            ->pluck('tipoExamen.area')
            ->filter(fn($a) => $a && $a->activo)
            ->unique('id');

        if ($areasPendientes->isEmpty()) {
            return null;
        }

        $this->limpiarTurnosViejos($areasPendientes->pluck('id')->toArray());

        // Calcular carga actual con un solo GROUP BY de turnos en_espera hoy
        $areasIds = $areasPendientes->pluck('id');
        $conteos = Turno::whereIn('area_id', $areasIds)
            ->where('estado', EstadoTurno::EnEspera)
            ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
            ->selectRaw('area_id, count(*) as total')
            ->groupBy('area_id')
            ->pluck('total', 'area_id');

        $areaElegida = $areasPendientes
            ->sortBy(fn(Area $a) => $conteos[$a->id] ?? 0)
            ->first();

        // Obtener todos los exámenes pendientes del paciente en el área elegida
        $examenesDelArea = $examenesPendientes
            ->filter(fn($ep) => $ep->tipoExamen?->area_id === $areaElegida->id);

        if ($examenesDelArea->isEmpty()) {
            return null;
        }

        $nombresExamenes = $examenesDelArea
            ->map(fn($ep) => $ep->tipoExamen?->nombre)
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $primerExamen = $examenesDelArea->first();

        $turno = DB::transaction(function () use ($paciente, $areaElegida, $primerExamen, $examenesDelArea, $nombresExamenes, $consaludIngresoId) {
            $numeroTurno = $this->generadorNumero->generar($areaElegida);

            $turno = Turno::create([
                'numero_turno' => $numeroTurno,
                'area_id' => $areaElegida->id,
                'paciente_id' => $paciente->id,
                'consalud_ingreso_id' => $consaludIngresoId ?? $primerExamen->consalud_ingreso_id,
                'examen_paciente_id' => $primerExamen->id,
                'nombre_paciente' => $paciente->nombre_completo,
                'estado' => EstadoTurno::EnEspera,
                'origen' => OrigenTurno::Recepcion,
                'metadatos' => [
                    'examenes_nombres' => $nombresExamenes,
                ],
            ]);

            foreach ($examenesDelArea as $ep) {
                $ep->update([
                    'estado' => EstadoExamenPaciente::EnCola,
                    'turno_id' => $turno->id,
                ]);
            }

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

    public function completarYAvanzar(Turno $turno): ?Turno
    {
        // Marcar como Completado todos los registros asociados al turno
        ExamenPaciente::where('turno_id', $turno->id)
            ->when($turno->examen_paciente_id, fn($q) => $q->orWhere('id', $turno->examen_paciente_id))
            ->update(['estado' => EstadoExamenPaciente::Completado]);

        if ($turno->paciente_id) {
            return $this->autoEncolarPaciente($turno->paciente_id, $turno->consalud_ingreso_id);
        }

        return null;
    }

    private function limpiarTurnosViejos(array $areaIds): void
    {
        $turnosCancelar = Turno::whereIn('area_id', $areaIds)
            ->where('estado', EstadoTurno::EnEspera)
            ->whereDate('created_at', '<', today())
            ->get();

        foreach ($turnosCancelar as $turno) {
            $turno->update(['estado' => EstadoTurno::Cancelado]);
            if ($turno->examen_paciente_id) {
                ExamenPaciente::where('id', $turno->examen_paciente_id)
                    ->where('estado', EstadoExamenPaciente::EnCola)
                    ->update(['estado' => EstadoExamenPaciente::Pendiente, 'turno_id' => null]);
            }
        }

        Turno::whereIn('area_id', $areaIds)
            ->where('estado', EstadoTurno::Llamando)
            ->whereDate('created_at', '<', today())
            ->update([
                'estado' => EstadoTurno::Completado,
                'completado_en' => now(),
            ]);
    }
}
