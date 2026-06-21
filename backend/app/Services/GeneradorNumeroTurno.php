<?php

namespace App\Services;

use App\Models\Area;
use Illuminate\Support\Facades\DB;

class GeneradorNumeroTurno
{
    public function generar(Area $area): string
    {
        $prefijo = $area->prefijo;

        $ultimoTurno = DB::table('turnos')
            ->where('area_id', $area->id)
            ->whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();

        $siguienteNumero = $ultimoTurno
            ? intval(substr($ultimoTurno->numero_turno, strlen($prefijo) + 1)) + 1
            : 1;

        return $prefijo . '-' . str_pad($siguienteNumero, 3, '0', STR_PAD_LEFT);
    }
}
