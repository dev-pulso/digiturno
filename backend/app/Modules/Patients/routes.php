<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Patients\Controllers\ControladorPaciente;

Route::middleware('auth.consalud')->group(function () {
    Route::get('pacientes/buscar-por-documento', [ControladorPaciente::class, 'buscarPorDocumento']);
    Route::apiResource('pacientes', ControladorPaciente::class)->except(['create', 'edit']);
});
