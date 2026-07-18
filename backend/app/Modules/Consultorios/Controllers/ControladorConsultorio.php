<?php

namespace App\Modules\Consultorios\Controllers;

use App\Models\Area;
use App\Models\Turno;
use App\Enums\EstadoTurno;
use App\Events\TurnoLlamado;
use App\Services\MaquinaEstadosTurnos;
use App\Services\ServicioExamenesPacientes;
use App\Modules\Turns\Resources\TurnoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorConsultorio extends Controller
{
    public function __construct(
        private MaquinaEstadosTurnos $maquinaEstados,
        private ServicioExamenesPacientes $servicioExamenes,
    ) {}

    public function cola(Area $area): JsonResponse
    {
        $turnosEnEspera = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::EnEspera)
            ->whereDate('created_at', today())
            ->orderBy('created_at')
            ->get();

        $turnoActual = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::Llamando)
            ->whereDate('created_at', today())
            ->latest('llamado_en')
            ->first();

        return response()->json([
            'actual' => $turnoActual ? new TurnoResource($turnoActual) : null,
            'en_espera' => TurnoResource::collection($turnosEnEspera),
        ]);
    }

    public function llamarSiguiente(Request $request, Area $area): JsonResponse
    {
        $cola = Turno::where('area_id', $area->id)
            ->where('estado', EstadoTurno::EnEspera)
            ->whereDate('created_at', today())
            ->orderBy('created_at')
            ->get();

        if ($cola->isEmpty()) {
            return response()->json(['mensaje' => 'No hay turnos en espera'], 404);
        }

        foreach ($cola as $siguiente) {
            $ocupado = Turno::turnoEnAtencionDePaciente($siguiente->paciente_id, $siguiente->id);

            if ($ocupado && $ocupado->area_id !== $siguiente->area_id) {
                continue;
            }

            $turno = $this->maquinaEstados->llamar(
                $siguiente,
                $request->input('llamado_por')
            );

            $turno->load('area', 'examenPaciente.tipoExamen');

            try { broadcast(new TurnoLlamado($turno)); } catch (\Exception $e) {}

            return response()->json(new TurnoResource($turno));
        }

        return response()->json(['mensaje' => 'No hay pacientes disponibles en este momento'], 404);
    }

    public function actual(Area $area): JsonResponse
    {
        $actual = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::Llamando)
            ->whereDate('created_at', today())
            ->latest('llamado_en')
            ->first();

        return response()->json([
            'data' => $actual ? new TurnoResource($actual) : null,
        ]);
    }

    public function historial(Area $area): JsonResponse
    {
        $historial = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->whereIn('estado', [EstadoTurno::Completado, EstadoTurno::Ausente])
            ->whereDate('created_at', today())
            ->latest('updated_at')
            ->take(10)
            ->get();

        return response()->json(TurnoResource::collection($historial));
    }
}
