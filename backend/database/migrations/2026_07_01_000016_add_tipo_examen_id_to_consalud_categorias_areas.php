<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consalud_categorias_areas', function (Blueprint $table) {
            $table->foreignId('tipo_examen_id')
                ->nullable()
                ->constrained('tipos_examenes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('consalud_categorias_areas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tipo_examen_id');
        });
    }
};
