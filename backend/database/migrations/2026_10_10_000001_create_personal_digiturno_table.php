<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_digiturno', function (Blueprint $table) {
            $table->id();
            $table->string('numero_documento', 30)->unique();
            $table->string('nombre')->nullable();
            $table->string('rol', 20)->default('recepcion'); // 'admin', 'recepcion', 'medico'
            $table->foreignId('area_id_predeterminada')->nullable()->constrained('areas')->nullOnDelete();
            $table->boolean('puede_rotar')->default(true);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index('numero_documento');
            $table->index('rol');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_digiturno');
    }
};
