<?php

namespace App\Modules\Turns\Controllers;

use App\Models\Area;
use App\Models\Turno;
use App\Models\TurnoLog;
use App\Enums\EstadoTurno;
use App\Enums\OrigenTurno;
use App\Events\TurnoLlamado;
use App\Events\TurnoCreado;
use App\Events\TurnoCompletado;
use App\Events\TurnoAusente;
use App\Events\TurnoRellamado;
use App\Modules\Turns\Requests\CrearTurnoRequest;
use App\Modules\Turns\Resources\TurnoResource;
use App\Services\GeneradorNumeroTurno;
use App\Services\MaquinaEstadosTurnos;
use App\Services\ServicioExamenesPacientes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorTurno extends Controller
{
    public function __construct(
        private GeneradorNumeroTurno $generadorNumero,
        private MaquinaEstadosTurnos $maquinaEstados,
        private ServicioExamenesPacientes $servicioExamenes,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Turno::with('area', 'examenPaciente.tipoExamen');

        if ($request->has('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->has('estado')) {
            $estados = explode(',', $request->estado);
            $query->whereIn('estado', $estados);
        }

        if ($request->boolean('hoy')) {
            $query->whereDate('created_at', today());
        }

        $turnos = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json(TurnoResource::collection($turnos));
    }

    public function store(CrearTurnoRequest $request): JsonResponse
    {
        $area = Area::findOrFail($request->area_id);
        $numeroTurno = $this->generadorNumero->generar($area);

        $turno = Turno::create([
            'numero_turno' => $numeroTurno,
            'area_id' => $area->id,
            'paciente_id' => $request->paciente_id,
            'examen_paciente_id' => $request->examen_paciente_id,
            'nombre_paciente' => $request->nombre_paciente,
            'estado' => EstadoTurno::EnEspera,
            'origen' => OrigenTurno::tryFrom($request->origen ?? 'recepcion') ?? OrigenTurno::Recepcion,
        ]);

        TurnoLog::create([
            'turno_id' => $turno->id,
            'accion' => 'creado',
            'estado_nuevo' => EstadoTurno::EnEspera->value,
        ]);

        $turno->load('area');

        try { broadcast(new TurnoCreado($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno), 201);
    }

    public function show(Turno $turno): JsonResponse
    {
        $turno->load('area', 'logs', 'examenPaciente.tipoExamen');
        return response()->json(new TurnoResource($turno));
    }

    public function llamar(Request $request, Turno $turno): JsonResponse
    {
        $turno = $this->maquinaEstados->llamar(
            $turno,
            $request->input('llamado_por')
        );

        $turno->load('area', 'examenPaciente.tipoExamen');
        try { broadcast(new TurnoLlamado($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno));
    }

    public function rellamar(Turno $turno): JsonResponse
    {
        $turno = $this->maquinaEstados->rellamar(
            $turno,
            null
        );

        $turno->load('area', 'examenPaciente.tipoExamen');
        try { broadcast(new TurnoRellamado($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno));
    }

    public function completar(Turno $turno): JsonResponse
    {
        $turno = $this->maquinaEstados->completar($turno);
        $turno->load('area', 'examenPaciente.tipoExamen');

        $this->servicioExamenes->completarYAvanzar($turno);

        try { broadcast(new TurnoCompletado($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno));
    }

    public function ausente(Turno $turno): JsonResponse
    {
        $turno = $this->maquinaEstados->ausente($turno);
        $turno->load('area', 'examenPaciente.tipoExamen');

        try { broadcast(new TurnoAusente($turno)); } catch (\Exception $e) {}

        return response()->json(new TurnoResource($turno));
    }

    public function cancelar(Turno $turno): JsonResponse
    {
        $turno = $this->maquinaEstados->cancelar($turno);
        $turno->load('area');
        return response()->json(new TurnoResource($turno));
    }

    public function displayByArea(Area $area): JsonResponse
    {
        $actual = Turno::with('area', 'examenPaciente.tipoExamen')
            ->where('area_id', $area->id)
            ->where('estado', EstadoTurno::Llamando)
            ->latest('llamado_en')
            ->first();

        $historial = Turno::with('area', 'examenPaciente.tipoExamen')
            ->where('area_id', $area->id)
            ->whereIn('estado', [EstadoTurno::Completado, EstadoTurno::Ausente])
            ->whereDate('created_at', today())
            ->latest('updated_at')
            ->take(5)
            ->get();

        $enEspera = Turno::where('area_id', $area->id)
            ->where('estado', EstadoTurno::EnEspera)
            ->count();

        return response()->json([
            'actual' => $actual ? new TurnoResource($actual) : null,
            'historial' => TurnoResource::collection($historial),
            'en_espera' => $enEspera,
        ]);
    }

    public function displayTodas(): JsonResponse
    {
        $areas = Area::where('activo', true)
            ->orderBy('id')
            ->get();

        $resultado = $areas->map(function ($area) {
            $actual = Turno::with('examenPaciente.tipoExamen')
                ->where('area_id', $area->id)
                ->where('estado', EstadoTurno::Llamando)
                ->latest('llamado_en')
                ->first();

            $historial = Turno::with('examenPaciente.tipoExamen')
                ->where('area_id', $area->id)
                ->whereIn('estado', [EstadoTurno::Completado, EstadoTurno::Ausente])
                ->whereDate('created_at', today())
                ->latest('updated_at')
                ->take(3)
                ->get();

            $enEspera = Turno::where('area_id', $area->id)
                ->where('estado', EstadoTurno::EnEspera)
                ->count();

            return [
                'id' => $area->id,
                'codigo' => $area->codigo,
                'nombre' => $area->nombre,
                'prefijo' => $area->prefijo,
                'color' => $area->color,
                'actual' => $actual ? new TurnoResource($actual) : null,
                'en_espera' => $enEspera,
                'historial' => TurnoResource::collection($historial),
            ];
        });

        return response()->json(['areas' => $resultado]);
    }
}
