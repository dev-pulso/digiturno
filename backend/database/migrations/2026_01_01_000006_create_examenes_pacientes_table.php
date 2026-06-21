<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examenes_pacientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('tipo_examen_id')->constrained('tipos_examenes')->cascadeOnDelete();
            $table->string('estado', 20)->default('pendiente');
            $table->foreignId('turno_id')->nullable()->constrained('turnos')->nullOnDelete();
            $table->timestamps();

            $table->unique(['paciente_id', 'tipo_examen_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examenes_pacientes');
    }
};
