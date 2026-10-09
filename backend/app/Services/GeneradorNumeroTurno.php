<?php

namespace App\Services;

use App\Models\Area;
use Illuminate\Support\Facades\DB;

class GeneradorNumeroTurno
{
    /**
     * Debe llamarse SIEMPRE dentro de una DB::transaction (usa lockForUpdate).
     */
    public function generar(Area $area): string
    {
        $prefijo = $area->prefijo;

        // === Secuencia DIARIA (activa): el primer turno de cada día es {prefijo}-001 ===
        $ultimoTurno = DB::table('turnos')
            ->where('area_id', $area->id)
            ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();

        /* === Secuencia GLOBAL (anterior). Para volver a como estaba:
              comenta el bloque de arriba y descomenta este.

        $ultimoTurno = DB::table('turnos')
            ->where('area_id', $area->id)
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();
        === fin secuencia global === */

        $siguienteNumero = $ultimoTurno
            ? intval(substr($ultimoTurno->numero_turno, strlen($prefijo) + 1)) + 1
            : 1;

        return $prefijo . '-' . str_pad($siguienteNumero, 3, '0', STR_PAD_LEFT);
    }
}
