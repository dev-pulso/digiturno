<?php

namespace App\Modules\Patients\Controllers;

use App\Models\Paciente;
use App\Modules\Patients\Requests\CrearPacienteRequest;
use App\Modules\Patients\Resources\PacienteResource;
use App\Services\ConsaludService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorPaciente extends Controller
{
    public function __construct(
        private ConsaludService $consaludService,
    ) {}

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
        $documento = $request->numero_documento;

        $token = $request->cookie('consalud_token') ?? $request->bearerToken();
        $data = $this->consaludService->buscarIngresoCompleto($documento, $token);
        $categoriasAreas = \App\Models\ConsaludCategoriaArea::with('area')->get();

        // Fallback local si Consalud falla o no trae ingreso (dev / API caída)
        if (!$data) {
            $local = Paciente::where('numero_documento', $documento)->first();
            if ($local) {
                $local->load([
                    'examenes' => function ($q) {
                        $q->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
                          ->with(['turno.area', 'tipoExamen.area']);
                    },
                ]);
                return response()->json([
                    'paciente' => new PacienteResource($local),
                    'ingreso' => null,
                    'historia_status' => null,
                    'categorias_areas' => $categoriasAreas,
                    'fuente' => 'local',
                    'aviso' => $this->consaludService->ultimoError()
                        ?? 'Paciente local (sin ingreso Consalud)',
                ]);
            }

            $errorConsalud = $this->consaludService->ultimoError();
            return response()->json([
                'mensaje' => $errorConsalud
                    ? 'Consalud no disponible y paciente no está en Digiturno'
                    : 'Paciente no encontrado',
                'detalle' => $errorConsalud,
            ], 404);
        }

        $ingresoId = $data['ingreso']['id'] ?? null;
        $data['paciente']->load([
            'examenes' => function ($q) use ($ingresoId) {
                $q->when(
                    $ingresoId,
                    fn($sub) => $sub->where('consalud_ingreso_id', $ingresoId),
                    fn($sub) => $sub->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
                )->with(['turno.area', 'tipoExamen.area']);
            },
        ]);

        return response()->json([
            'paciente' => new PacienteResource($data['paciente']),
            'ingreso' => $this->formatearIngreso($data['ingreso']),
            'historia_status' => $data['historia_status'],
            'categorias_areas' => $categoriasAreas,
            'fuente' => 'consalud',
        ]);
    }

    private function formatearIngreso(array $ingreso): array
    {
        $paciente = $ingreso['paciente'] ?? [];
        $examenes = $ingreso['examenes'] ?? [];

        return [
            'id' => $ingreso['id'] ?? null,
            'fecha_atencion' => $ingreso['fecha_atencion'] ?? null,
            'observacion' => $ingreso['observacion'] ?? null,
            'cliente' => [
                'id' => $ingreso['cliente']['id'] ?? null,
                'razon_social' => $ingreso['cliente']['razon_social'] ?? null,
            ],
            'sede' => [
                'id' => $ingreso['sede']['id'] ?? null,
                'nombre_sede' => $ingreso['sede']['nombre_sede'] ?? null,
            ],
            'empresa_labor' => [
                'id' => $ingreso['empresa_labor']['id'] ?? null,
                'nombre' => $ingreso['empresa_labor']['nombre'] ?? null,
            ],
            'tipo_evaluacion' => [
                'id' => $ingreso['tipo_evaluacion']['id'] ?? null,
                'nombre' => $ingreso['tipo_evaluacion']['nombre'] ?? null,
            ],
            'ocupacion' => [
                'id' => $ingreso['ocupacion']['id'] ?? null,
                'nombre' => $ingreso['ocupacion']['nombre'] ?? null,
            ],
            'examenes' => array_map(function ($ex) {
                return [
                    'id' => $ex['id'] ?? null,
                    'examen_id' => $ex['examen_id'] ?? null,
                    'estado' => $ex['estado'] ?? null,
                    'examen' => [
                        'id' => $ex['examen']['id'] ?? null,
                        'cdg_examen' => $ex['examen']['cdg_examen'] ?? null,
                        'nbr_examen' => $ex['examen']['nbr_examen'] ?? null,
                        'categoria_exam_id' => $ex['examen']['categoria_exam_id'] ?? null,
                    ],
                ];
            }, $examenes),
        ];
    }
}
