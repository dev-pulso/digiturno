<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pacientes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_documento', 10);
            $table->string('numero_documento', 30);
            $table->string('nombre_completo');
            $table->string('telefono', 20)->nullable();
            $table->string('correo')->nullable();
            $table->jsonb('metadatos')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tipo_documento', 'numero_documento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pacientes');
    }
};
