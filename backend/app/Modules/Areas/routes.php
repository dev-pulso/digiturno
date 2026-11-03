<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Areas\Controllers\ControladorArea;

Route::middleware('auth.consalud')->group(function () {
    Route::get('areas', [ControladorArea::class, 'index']);
    Route::get('areas/{area}', [ControladorArea::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::post('areas', [ControladorArea::class, 'store']);
        Route::put('areas/{area}', [ControladorArea::class, 'update']);
        Route::delete('areas/{area}', [ControladorArea::class, 'destroy']);
    });
});
