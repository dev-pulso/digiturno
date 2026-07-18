<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consalud_ingresos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->constrained()->onDelete('cascade');
            $table->bigInteger('consalud_ingreso_id');
            $table->jsonb('ingreso_json');
            $table->jsonb('examenes_asignados');
            $table->jsonb('turnos_creados');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consalud_ingresos');
    }
};
