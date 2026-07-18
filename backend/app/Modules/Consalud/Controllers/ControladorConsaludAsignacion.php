<?php

namespace App\Modules\Consalud\Controllers;

use App\Models\ConsaludCategoriaArea;
use App\Models\ConsaludIngreso;
use App\Models\ExamenPaciente;
use App\Models\Paciente;
use App\Models\TipoExamen;
use App\Models\Turno;
use App\Enums\EstadoExamenPaciente;
use App\Enums\EstadoTurno;
use App\Enums\OrigenTurno;
use App\Events\TurnoCreado;
use App\Services\GeneradorNumeroTurno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ControladorConsaludAsignacion extends Controller
{
    public function __construct(
        private GeneradorNumeroTurno $generadorNumero,
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
        $turnosResultantes = [];
        $examenesAsignados = [];
        $errores = [];

        DB::beginTransaction();
        try {
            // Resolver mappings y agrupar por área para evitar turnos duplicados.
            $gruposPorArea = [];
            foreach ($examenesSeleccionados as $item) {
                $categoriaExamId = $item['categoria_exam_id'];

                $mapping = ConsaludCategoriaArea::with('area')->where('categoria_exam_id', $categoriaExamId)->first();
                if (!$mapping || !$mapping->area) {
                    $errores[] = "No hay área configurada para la categoría {$categoriaExamId}.";
                    $examenesAsignados[] = [
                        'examen_ingreso_id' => $item['examen_ingreso_id'],
                        'categoria_exam_id' => $categoriaExamId,
                        'error' => 'Sin mapping de área',
                    ];
                    continue;
                }

                $tipoExamen = $this->resolverTipoExamen($mapping);
                if (!$tipoExamen) {
                    $errores[] = "No se pudo resolver el tipo de examen para la categoría {$categoriaExamId}.";
                    $examenesAsignados[] = [
                        'examen_ingreso_id' => $item['examen_ingreso_id'],
                        'categoria_exam_id' => $categoriaExamId,
                        'error' => 'Sin tipo de examen',
                    ];
                    continue;
                }

                $areaId = $mapping->area_id;
                if (!isset($gruposPorArea[$areaId])) {
                    $gruposPorArea[$areaId] = [
                        'mapping' => $mapping,
                        'tipo_examen' => $tipoExamen,
                        'examenes' => [],
                    ];
                }

                $gruposPorArea[$areaId]['examenes'][] = [
                    'examen_ingreso_id' => $item['examen_ingreso_id'],
                    'categoria_exam_id' => $categoriaExamId,
                ];
            }

            if (empty($gruposPorArea)) {
                DB::rollBack();
                return response()->json([
                    'mensaje' => 'No se pudo asignar ningún examen.',
                    'errores' => $errores,
                ], 400);
            }

            foreach ($gruposPorArea as $areaId => $grupo) {
                $mapping = $grupo['mapping'];
                $tipoExamen = $grupo['tipo_examen'];
                $area = $mapping->area;

                $examenPaciente = ExamenPaciente::firstOrCreate(
                    [
                        'paciente_id' => $paciente->id,
                        'tipo_examen_id' => $tipoExamen->id,
                    ],
                    [
                        'estado' => EstadoExamenPaciente::Pendiente,
                    ]
                );

                if ($examenPaciente->estado === EstadoExamenPaciente::Completado) {
                    $errores[] = "El examen de {$tipoExamen->nombre} ya fue completado.";
                    foreach ($grupo['examenes'] as $examen) {
                        $examenesAsignados[] = [
                            ...$examen,
                            'area_id' => $areaId,
                            'tipo_examen_id' => $tipoExamen->id,
                            'error' => 'Examen ya completado',
                        ];
                    }
                    continue;
                }

                $turno = null;
                if ($examenPaciente->estado === EstadoExamenPaciente::EnCola && $examenPaciente->turno_id) {
                    $turnoExistente = Turno::find($examenPaciente->turno_id);
                    if ($turnoExistente && $turnoExistente->estado === EstadoTurno::EnEspera) {
                        $turno = $turnoExistente;
                    }
                }

                if (!$turno) {
                    $examenPaciente->update(['estado' => EstadoExamenPaciente::EnCola]);

                    $numeroTurno = $this->generadorNumero->generar($area);

                    $turno = Turno::create([
                        'numero_turno' => $numeroTurno,
                        'area_id' => $areaId,
                        'paciente_id' => $paciente->id,
                        'examen_paciente_id' => $examenPaciente->id,
                        'nombre_paciente' => $paciente->nombre_completo,
                        'estado' => EstadoTurno::EnEspera,
                        'origen' => OrigenTurno::Recepcion,
                    ]);

                    $examenPaciente->update(['turno_id' => $turno->id]);

                    $turno->load('area', 'examenPaciente.tipoExamen');

                    try {
                        broadcast(new TurnoCreado($turno));
                    } catch (\Exception $e) {
                        Log::warning('Consalud: broadcast fallido: ' . $e->getMessage());
                    }
                }

                $turnosResultantes[] = $turno;

                foreach ($grupo['examenes'] as $examen) {
                    $examenesAsignados[] = [
                        ...$examen,
                        'area_id' => $areaId,
                        'tipo_examen_id' => $tipoExamen->id,
                        'turno_id' => $turno->id,
                    ];
                }
            }

            if (empty($turnosResultantes)) {
                DB::rollBack();
                return response()->json([
                    'mensaje' => 'No se pudo asignar ningún examen.',
                    'errores' => $errores,
                ], 400);
            }

            ConsaludIngreso::create([
                'paciente_id' => $paciente->id,
                'consalud_ingreso_id' => $request->ingreso_id,
                'ingreso_json' => $request->ingreso,
                'examenes_asignados' => $examenesAsignados,
                'turnos_creados' => array_map(fn($t) => [
                    'id' => $t->id,
                    'numero_turno' => $t->numero_turno,
                    'area_id' => $t->area_id,
                    'area_nombre' => $t->area->nombre ?? null,
                ], $turnosResultantes),
            ]);

            DB::commit();

            $turnosUnicos = collect($turnosResultantes)->unique('id')->values();
            $nuevos = $turnosUnicos->filter(fn($t) => $t->wasRecentlyCreated)->count();
            $reutilizados = $turnosUnicos->count() - $nuevos;

            $mensaje = match (true) {
                $nuevos > 0 && $reutilizados > 0 => "{$nuevos} turno(s) nuevo(s) y {$reutilizados} reutilizado(s).",
                $nuevos > 0 => "{$nuevos} turno(s) creado(s).",
                $reutilizados > 0 => "{$reutilizados} turno(s) ya estaba(n) en cola.",
                default => 'Turnos asignados.',
            };

            return response()->json([
                'mensaje' => $mensaje,
                'errores' => $errores,
                'turnos' => $turnosUnicos->map(fn($t) => [
                    'id' => $t->id,
                    'numero_turno' => $t->numero_turno,
                    'area_id' => $t->area_id,
                    'area_nombre' => $t->area->nombre ?? null,
                    'area_prefijo' => $t->area->prefijo ?? null,
                    'examen_nombre' => $t->examenPaciente?->tipoExamen?->nombre ?? null,
                ])->all(),
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
