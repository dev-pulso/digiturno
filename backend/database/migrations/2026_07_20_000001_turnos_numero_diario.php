<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Numeración diaria: numero_turno se repite entre días (C1-001 cada mañana).
// Se quita el UNIQUE global; la unicidad del día la garantiza lockForUpdate
// dentro de DB::transaction en GeneradorNumeroTurno. Índice compuesto para colas.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropUnique(['numero_turno']);
            $table->index(['area_id', 'estado', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropIndex(['area_id', 'estado', 'created_at']);
            $table->unique(['numero_turno']);
        });
    }
};
