<?php

namespace App\Services;

use App\Models\Area;
use Illuminate\Support\Facades\DB;

class GeneradorNumeroTurno
{
    /** @return array{numero_turno: string, fecha_turno: string, consecutivo_diario: int} */
    public function generar(Area $area): array
    {
        $prefijo = $area->prefijo;

        $fecha = now(config('app.timezone'))->toDateString();
        $ultimoTurno = DB::table('turnos')
            ->where('area_id', $area->id)
            ->where('fecha_turno', $fecha)
            ->orderByDesc('consecutivo_diario')
            ->lockForUpdate()
            ->first();

        $siguienteNumero = $ultimoTurno ? ((int) $ultimoTurno->consecutivo_diario) + 1 : 1;

        return [
            'numero_turno' => $prefijo . '-' . str_pad((string) $siguienteNumero, 3, '0', STR_PAD_LEFT),
            'fecha_turno' => $fecha,
            'consecutivo_diario' => $siguienteNumero,
        ];
    }
}
