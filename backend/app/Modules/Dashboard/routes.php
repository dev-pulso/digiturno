<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Dashboard\Controllers\ControladorDashboard;

Route::middleware(['auth.consalud', 'role:admin'])->prefix('dashboard')->group(function () {
    Route::get('resumen', [ControladorDashboard::class, 'resumen']);
    Route::get('alertas', [ControladorDashboard::class, 'alertas']);
    Route::get('tendencia-horaria', [ControladorDashboard::class, 'tendenciaHoraria']);
});
