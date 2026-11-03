<?php

namespace App\Modules\Consalud\Controllers;

use App\Models\ConsaludCategoriaArea;
use App\Models\ConsaludIngreso;
use App\Models\ExamenPaciente;
use App\Models\Paciente;
use App\Models\TipoExamen;
use App\Enums\EstadoExamenPaciente;
use App\Services\ServicioExamenesPacientes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ControladorConsaludAsignacion extends Controller
{
    public function __construct(
        private ServicioExamenesPacientes $servicioExamenes,
    ) {}

    public function asignarTurnos(Request $request): JsonResponse
    {
        $request->validate([
            'paciente_id' => 'required|exists:pacientes,id',
            'ingreso_id' => 'required|integer',
            'ingreso' => 'required|array',
            'examenes_seleccionados' => 'required|array|min:1',
            'examenes_seleccionados.*.examen_ingreso_id' => 'required|integer',
            'examenes_seleccionados.*.categoria_exam_id' => 'required|integer',
        ]);

        $paciente = Paciente::findOrFail($request->paciente_id);
        $examenesSeleccionados = $request->examenes_seleccionados;
        $examenesAsignados = [];
        $errores = [];

        DB::beginTransaction();
        try {
            // Agrupar items seleccionados por tipo de examen para recopilar examen_ingreso_ids
            $examenesPorTipo = [];
            foreach ($examenesSeleccionados as $item) {
                $categoriaExamId = $item['categoria_exam_id'];

                $mapping = ConsaludCategoriaArea::with('area')->where('categoria_exam_id', $categoriaExamId)->first();
                if (!$mapping || !$mapping->area) {
                    $errores[] = "No hay área configurada para la categoría {$categoriaExamId}.";
                    continue;
                }

                $tipoExamen = $this->resolverTipoExamen($mapping);
                if (!$tipoExamen) {
                    $errores[] = "No se pudo resolver el tipo de examen para la categoría {$categoriaExamId}.";
                    continue;
                }

                $tipoId = $tipoExamen->id;
                if (!isset($examenesPorTipo[$tipoId])) {
                    $examenesPorTipo[$tipoId] = [
                        'tipo_examen' => $tipoExamen,
                        'categoria_exam_id' => $categoriaExamId,
                        'area_id' => $mapping->area_id,
                        'examen_ingreso_ids' => [],
                    ];
                }
                $examenesPorTipo[$tipoId]['examen_ingreso_ids'][] = $item['examen_ingreso_id'];
            }

            if (empty($examenesPorTipo)) {
                DB::rollBack();
                return response()->json([
                    'mensaje' => 'No se pudo asignar ningún examen.',
                    'errores' => $errores,
                ], 400);
            }

            foreach ($examenesPorTipo as $tipoId => $data) {
                $tipoExamen = $data['tipo_examen'];

                $examenPaciente = ExamenPaciente::firstOrCreate(
                    [
                        'paciente_id' => $paciente->id,
                        'consalud_ingreso_id' => $request->ingreso_id,
                        'tipo_examen_id' => $tipoExamen->id,
                    ],
                    [
                        'estado' => EstadoExamenPaciente::Pendiente,
                        'examen_ingreso_ids' => $data['examen_ingreso_ids'],
                    ]
                );

                // Si ya existía previamente en este ingreso, sincronizar IDs de examen de Consalud
                if ($examenPaciente->examen_ingreso_ids !== $data['examen_ingreso_ids']) {
                    $examenPaciente->update(['examen_ingreso_ids' => $data['examen_ingreso_ids']]);
                }

                $examenesAsignados[] = [
                    'tipo_examen_id' => $tipoExamen->id,
                    'tipo_examen_nombre' => $tipoExamen->nombre,
                    'categoria_exam_id' => $data['categoria_exam_id'],
                    'area_id' => $data['area_id'],
                    'examen_ingreso_ids' => $data['examen_ingreso_ids'],
                    'estado' => $examenPaciente->estado->value,
                ];
            }

            // Enrutamiento secuencial: auto-encolar paciente en la estación con menor cola
            $turnoActivo = $this->servicioExamenes->autoEncolarPaciente($paciente->id, $request->ingreso_id);

            // Registro de auditoría
            ConsaludIngreso::create([
                'paciente_id' => $paciente->id,
                'consalud_ingreso_id' => $request->ingreso_id,
                'ingreso_json' => $request->ingreso,
                'examenes_asignados' => $examenesAsignados,
                'turnos_creados' => $turnoActivo ? [[
                    'id' => $turnoActivo->id,
                    'numero_turno' => $turnoActivo->numero_turno,
                    'area_id' => $turnoActivo->area_id,
                    'area_nombre' => $turnoActivo->area->nombre ?? null,
                ]] : [],
            ]);

            DB::commit();

            // Listar exámenes que quedaron en estado pendiente para las siguientes estaciones
            $examenesPendientesSiguientes = ExamenPaciente::where('paciente_id', $paciente->id)
                ->where('consalud_ingreso_id', $request->ingreso_id)
                ->where('estado', EstadoExamenPaciente::Pendiente)
                ->with('tipoExamen.area')
                ->get()
                ->map(fn($ep) => [
                    'id' => $ep->id,
                    'tipo_examen_id' => $ep->tipo_examen_id,
                    'nombre' => $ep->tipoExamen?->nombre,
                    'area_nombre' => $ep->tipoExamen?->area?->nombre,
                    'estado' => $ep->estado->value,
                ]);

            $turnoData = null;
            if ($turnoActivo) {
                $turnoActivo->loadMissing('area', 'examenPaciente.tipoExamen');
                $turnoData = [
                    'id' => $turnoActivo->id,
                    'numero_turno' => $turnoActivo->numero_turno,
                    'area_id' => $turnoActivo->area_id,
                    'area_nombre' => $turnoActivo->area->nombre ?? null,
                    'area_prefijo' => $turnoActivo->area->prefijo ?? null,
                    'examenes_nombres' => $turnoActivo->metadatos['examenes_nombres'] ?? [$turnoActivo->examenPaciente?->tipoExamen?->nombre],
                    'estado' => $turnoActivo->estado->value,
                ];
            }

            return response()->json([
                'mensaje' => $turnoActivo
                    ? "Turno asignado: {$turnoActivo->numero_turno} ({$turnoActivo->area->nombre})."
                    : "Exámenes registrados en circuito.",
                'errores' => $errores,
                'turno_activo' => $turnoData,
                'turnos' => $turnoData ? [$turnoData] : [],
                'examenes_pendientes_circuito' => $examenesPendientesSiguientes,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Consalud: error al asignar turnos: ' . $e->getMessage());
            return response()->json(['mensaje' => 'Error al asignar turnos: ' . $e->getMessage()], 500);
        }
    }

    private function resolverTipoExamen(ConsaludCategoriaArea $mapping): ?TipoExamen
    {
        if ($mapping->tipo_examen_id) {
            $tipo = TipoExamen::find($mapping->tipo_examen_id);
            if ($tipo && $tipo->area_id === $mapping->area_id) {
                return $tipo;
            }
        }

        $tipo = TipoExamen::where('nombre', $mapping->nombre)
            ->where('area_id', $mapping->area_id)
            ->first();

        if (!$tipo) {
            $codigo = $this->generarCodigo($mapping->nombre);
            $tipo = TipoExamen::create([
                'nombre' => $mapping->nombre,
                'codigo' => $codigo,
                'area_id' => $mapping->area_id,
                'activo' => true,
            ]);
        }

        $mapping->update(['tipo_examen_id' => $tipo->id]);

        return $tipo;
    }

    private function generarCodigo(string $nombre): string
    {
        $base = Str::upper(Str::substr(Str::slug($nombre, ''), 0, 3));
        $codigo = $base;

        $contador = 0;
        while (TipoExamen::where('codigo', $codigo)->exists()) {
            $contador++;
            $codigo = Str::substr($base, 0, 3 - strlen((string) $contador)) . $contador;
        }
        return $codigo;
    }
}
