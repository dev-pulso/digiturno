<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turnos', function (Blueprint $table) {
            $table->id();
            $table->string('numero_turno', 20)->unique();
            $table->foreignId('area_id')->constrained();
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes');
            $table->unsignedBigInteger('examen_paciente_id')->nullable();
            $table->string('nombre_paciente');
            $table->string('estado', 20)->default('en_espera');
            $table->string('origen', 20)->default('recepcion');
            $table->string('llamado_por')->nullable();
            $table->timestamp('llamado_en')->nullable();
            $table->timestamp('completado_en')->nullable();
            $table->timestamp('ausente_en')->nullable();
            $table->integer('contador_llamados')->default(0);
            $table->integer('segundos_espera')->nullable();
            $table->integer('segundos_servicio')->nullable();
            $table->jsonb('metadatos')->nullable();
            $table->timestamps();

            $table->index(['area_id', 'estado']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turnos');
    }
};
