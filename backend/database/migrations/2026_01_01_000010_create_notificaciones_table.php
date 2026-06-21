<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turno_id')->nullable()->constrained('turnos')->cascadeOnDelete();
            $table->string('tipo');
            $table->string('destinatario');
            $table->text('mensaje');
            $table->string('estado', 20)->default('pendiente');
            $table->jsonb('metadatos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
