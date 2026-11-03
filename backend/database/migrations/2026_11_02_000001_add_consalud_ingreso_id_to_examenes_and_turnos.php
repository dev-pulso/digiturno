<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('examenes_pacientes', function (Blueprint $table) {
            $table->unsignedBigInteger('consalud_ingreso_id')->nullable()->index();
            $table->jsonb('examen_ingreso_ids')->nullable();
            $table->dropUnique(['paciente_id', 'tipo_examen_id']);
            $table->unique(['paciente_id', 'consalud_ingreso_id', 'tipo_examen_id']);
        });

        Schema::table('turnos', function (Blueprint $table) {
            $table->unsignedBigInteger('consalud_ingreso_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn('consalud_ingreso_id');
        });

        Schema::table('examenes_pacientes', function (Blueprint $table) {
            $table->dropUnique(['paciente_id', 'consalud_ingreso_id', 'tipo_examen_id']);
            $table->unique(['paciente_id', 'tipo_examen_id']);
            $table->dropColumn(['consalud_ingreso_id', 'examen_ingreso_ids']);
        });
    }
};
