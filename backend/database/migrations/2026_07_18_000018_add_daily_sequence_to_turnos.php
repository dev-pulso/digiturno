<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->date('fecha_turno')->nullable()->after('numero_turno');
            $table->unsignedInteger('consecutivo_diario')->nullable()->after('fecha_turno');
            $table->unique(['area_id', 'fecha_turno', 'consecutivo_diario'], 'turnos_area_fecha_consecutivo_unique');
            $table->index(['fecha_turno', 'area_id', 'estado'], 'turnos_fecha_area_estado_index');
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropIndex('turnos_fecha_area_estado_index');
            $table->dropUnique('turnos_area_fecha_consecutivo_unique');
            $table->dropColumn(['fecha_turno', 'consecutivo_diario']);
        });
    }
};
