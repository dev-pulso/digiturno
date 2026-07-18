<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consalud_categorias_areas', function (Blueprint $table) {
            $table->id();
            $table->integer('categoria_exam_id')->unique();
            $table->foreignId('area_id')->constrained()->onDelete('cascade');
            $table->string('nombre')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consalud_categorias_areas');
    }
};
