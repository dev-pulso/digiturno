<?php

namespace App\Modules\Dashboard\Controllers;

use App\Models\Area;
use App\Models\Turno;
use App\Enums\EstadoTurno;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ControladorDashboard extends Controller
{
    public function resumen(): JsonResponse
    {
        $hoy = today();

        $total = Turno::whereDate('created_at', $hoy)->count();
        $enEspera = Turno::whereDate('created_at', $hoy)->where('estado', EstadoTurno::EnEspera)->count();
        $llamando = Turno::whereDate('created_at', $hoy)->where('estado', EstadoTurno::Llamando)->count();
        $completados = Turno::whereDate('created_at', $hoy)->where('estado', EstadoTurno::Completado)->count();
        $ausentes = Turno::whereDate('created_at', $hoy)->where('estado', EstadoTurno::Ausente)->count();

        $avgEspera = Turno::whereDate('created_at', $hoy)
            ->whereNotNull('segundos_espera')
            ->avg('segundos_espera');

        $avgServicio = Turno::whereDate('created_at', $hoy)
            ->whereNotNull('segundos_servicio')
            ->avg('segundos_servicio');

        $estadisticasAreas = Area::withCount([
            'turnos as total_turnos' => fn($q) => $q->whereDate('created_at', $hoy),
            'turnos as turnos_espera' => fn($q) => $q->whereDate('created_at', $hoy)->where('estado', EstadoTurno::EnEspera),
            'turnos as turnos_completados' => fn($q) => $q->whereDate('created_at', $hoy)->where('estado', EstadoTurno::Completado),
        ])->get()->map(fn($a) => [
            'area_id' => $a->id,
            'area_nombre' => $a->nombre,
            'area_codigo' => $a->codigo,
            'total' => $a->total_turnos,
            'en_espera' => $a->turnos_espera,
            'completados' => $a->turnos_completados,
            'avg_espera' => round(Turno::where('area_id', $a->id)
                ->whereDate('created_at', $hoy)
                ->whereNotNull('segundos_espera')
                ->avg('segundos_espera') ?? 0),
        ]);

        return response()->json([
            'total_turnos' => $total,
            'turnos_espera' => $enEspera,
            'turnos_llamando' => $llamando,
            'turnos_completados' => $completados,
            'turnos_ausentes' => $ausentes,
            'avg_segundos_espera' => round($avgEspera ?? 0),
            'avg_segundos_servicio' => round($avgServicio ?? 0),
            'estadisticas_areas' => $estadisticasAreas,
        ]);
    }

    public function alertas(): JsonResponse
    {
        $hoy = today();

        $areas = Area::withCount([
            'turnos as turnos_espera_count' => fn($q) => $q->whereDate('created_at', $hoy)->where('estado', EstadoTurno::EnEspera),
            'turnos as turnos_ausentes_count' => fn($q) => $q->whereDate('created_at', $hoy)->where('estado', EstadoTurno::Ausente),
        ])->get();

        $criticas = $areas->filter(fn($a) => $a->turnos_espera_count > 10);
        $altosAusentes = $areas->filter(fn($a) => $a->turnos_ausentes_count > 5);

        $alerts = [];

        foreach ($criticas as $area) {
            $alerts[] = [
                'tipo' => 'cola_critica',
                'severidad' => 'alta',
                'mensaje' => "{$area->nombre} tiene {$area->turnos_espera_count} pacientes en espera",
                'area_codigo' => $area->codigo,
            ];
        }

        foreach ($altosAusentes as $area) {
            $alerts[] = [
                'tipo' => 'muchos_ausentes',
                'severidad' => 'media',
                'mensaje' => "{$area->nombre} reportó {$area->turnos_ausentes_count} ausencias hoy",
                'area_codigo' => $area->codigo,
            ];
        }

        return response()->json($alerts);
    }

    public function tendenciaHoraria(): JsonResponse
    {
        $hoy = today();

        $horaria = Turno::select(
            DB::raw("EXTRACT(HOUR FROM created_at) as hora"),
            DB::raw("COUNT(*) as total"),
            DB::raw("SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados"),
        )
            ->whereDate('created_at', $hoy)
            ->groupBy('hora')
            ->orderBy('hora')
            ->get()
            ->map(fn($h) => [
                'hora' => (int) $h->hora,
                'total' => (int) $h->total,
                'completados' => (int) $h->completados,
            ]);

        return response()->json($horaria);
    }
}
