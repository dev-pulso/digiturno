<?php

use Illuminate\Support\Facades\Route;
use App\Modules\TiposExamenes\Controllers\ControladorTipoExamen;

Route::middleware('auth.consalud')->group(function () {
    Route::get('tipos-examenes', [ControladorTipoExamen::class, 'index']);
    Route::get('tipos-examenes/{tipo}', [ControladorTipoExamen::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::post('tipos-examenes', [ControladorTipoExamen::class, 'store']);
        Route::put('tipos-examenes/{tipo}', [ControladorTipoExamen::class, 'update']);
        Route::delete('tipos-examenes/{tipo}', [ControladorTipoExamen::class, 'destroy']);
    });
});
