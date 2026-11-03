<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Consalud\Controllers\ControladorConsaludAsignacion;
use App\Modules\Consalud\Controllers\ControladorConsaludCategorias;

Route::middleware('auth.consalud')->group(function () {
    Route::post('consalud/asignar-turnos', [ControladorConsaludAsignacion::class, 'asignarTurnos']);
    Route::get('consalud/categorias-areas', [ControladorConsaludCategorias::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        Route::post('consalud/categorias-areas', [ControladorConsaludCategorias::class, 'store']);
        Route::put('consalud/categorias-areas/{id}', [ControladorConsaludCategorias::class, 'update']);
    });
});
