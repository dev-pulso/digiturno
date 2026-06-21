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
            ->orderBy('created_at')
            ->get();

        $turnoActual = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::Llamando)
            ->latest('llamado_en')
            ->first();

        return response()->json([
            'actual' => $turnoActual ? new TurnoResource($turnoActual) : null,
            'en_espera' => TurnoResource::collection($turnosEnEspera),
        ]);
    }

    public function llamarSiguiente(Request $request, Area $area): JsonResponse
    {
        $siguiente = Turno::where('area_id', $area->id)
            ->where('estado', EstadoTurno::EnEspera)
            ->orderBy('created_at')
            ->first();

        if (!$siguiente) {
            return response()->json(['mensaje' => 'No hay turnos en espera'], 404);
        }

        $turno = $this->maquinaEstados->llamar(
            $siguiente,
            $request->input('llamado_por')
        );

        $turno->load('area', 'examenPaciente.tipoExamen');

        try { broadcast(new TurnoLlamado($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno));
    }

    public function actual(Area $area): JsonResponse
    {
        $actual = Turno::with(['examenPaciente.tipoExamen'])
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::Llamando)
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
