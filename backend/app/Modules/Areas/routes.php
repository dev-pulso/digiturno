<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Areas\Controllers\ControladorArea;

Route::get('areas', [ControladorArea::class, 'index']);
Route::get('areas/{area}', [ControladorArea::class, 'show']);

Route::middleware('consalud.permission:digiturno.admin')->group(function () {
    Route::post('areas', [ControladorArea::class, 'store']);
    Route::put('areas/{area}', [ControladorArea::class, 'update']);
    Route::patch('areas/{area}', [ControladorArea::class, 'update']);
    Route::delete('areas/{area}', [ControladorArea::class, 'destroy']);
});
