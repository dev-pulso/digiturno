<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->foreign('examen_paciente_id')
                ->references('id')
                ->on('examenes_pacientes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropForeign(['examen_paciente_id']);
        });
    }
};
