<?php

namespace App\Modules\ExamenesPacientes\Controllers;

use App\Models\Paciente;
use App\Modules\ExamenesPacientes\Resources\ExamenPacienteResource;
use App\Services\ServicioExamenesPacientes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorExamenPaciente extends Controller
{
    public function __construct(
        private ServicioExamenesPacientes $servicioExamenes,
    ) {}

    public function listarPorPaciente(Paciente $paciente): JsonResponse
    {
        $examenes = $paciente->examenes()
            ->with('tipoExamen.area')
            ->orderBy('created_at')
            ->get();

        return response()->json(ExamenPacienteResource::collection($examenes));
    }

    public function asignar(Request $request, Paciente $paciente): JsonResponse
    {
        $request->validate([
            'tipos_examenes_ids' => 'required|array|min:1',
            'tipos_examenes_ids.*' => 'required|exists:tipos_examenes,id',
        ]);

        $examenes = $this->servicioExamenes->asignarExamenes(
            $paciente->id,
            $request->tipos_examenes_ids
        );

        $turno = $paciente->turnos()
            ->with('area', 'examenPaciente.tipoExamen')
            ->where('estado', 'en_espera')
            ->latest()
            ->first();

        return response()->json([
            'examenes' => ExamenPacienteResource::collection($examenes),
            'turno' => $turno ? [
                'id' => $turno->id,
                'numero_turno' => $turno->numero_turno,
                'area' => $turno->area?->nombre,
                'examen' => $turno->examenPaciente?->tipoExamen?->nombre,
            ] : null,
        ], 201);
    }
}
