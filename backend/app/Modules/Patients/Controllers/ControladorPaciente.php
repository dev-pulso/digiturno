<?php

namespace App\Modules\Patients\Controllers;

use App\Models\Paciente;
use App\Modules\Patients\Requests\CrearPacienteRequest;
use App\Modules\Patients\Resources\PacienteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorPaciente extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paciente::query();

        if ($request->has('buscar')) {
            $termino = $request->buscar;
            $query->where(function ($q) use ($termino) {
                $q->where('nombre_completo', 'ilike', "%{$termino}%")
                  ->orWhere('numero_documento', 'ilike', "%{$termino}%");
            });
        }

        $pacientes = $query->orderBy('nombre_completo')
            ->paginate($request->per_page ?? 25);

        return response()->json(PacienteResource::collection($pacientes));
    }

    public function store(CrearPacienteRequest $request): JsonResponse
    {
        $paciente = Paciente::create($request->validated());
        return response()->json(new PacienteResource($paciente), 201);
    }

    public function show(Paciente $paciente): JsonResponse
    {
        $paciente->load('examenes.tipoExamen.area');
        return response()->json(new PacienteResource($paciente));
    }

    public function update(Request $request, Paciente $paciente): JsonResponse
    {
        $request->validate([
            'nombre_completo' => 'sometimes|string|max:255',
            'tipo_documento' => 'sometimes|string|max:10',
            'numero_documento' => 'sometimes|string|max:30',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:255',
        ]);

        $paciente->update($request->only([
            'nombre_completo', 'tipo_documento', 'numero_documento',
            'telefono', 'correo',
        ]));

        return response()->json(new PacienteResource($paciente));
    }

    public function buscarPorDocumento(Request $request): JsonResponse
    {
        $request->validate(['numero_documento' => 'required|string|max:30']);

        $paciente = Paciente::buscarPorDocumento($request->numero_documento)
            ->with('examenes.tipoExamen.area')
            ->first();

        if (!$paciente) {
            return response()->json(['mensaje' => 'Paciente no encontrado'], 404);
        }

        return response()->json(new PacienteResource($paciente));
    }
}
