<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Admin\Controllers\ControladorVideo;
use App\Modules\Admin\Controllers\ControladorPersonal;

Route::get('videos/playlist', [ControladorVideo::class, 'playlist']);
Route::post('videos/reordenar', [ControladorVideo::class, 'reorder'])->middleware('throttle:20,1');
Route::post('videos/{video}/toggle', [ControladorVideo::class, 'toggle'])->middleware('throttle:20,1');
Route::apiResource('videos', ControladorVideo::class)->except(['create', 'edit'])->middleware('throttle:20,1');

Route::prefix('admin')->group(function () {
    Route::get('personal', [ControladorPersonal::class, 'index']);
    Route::post('personal', [ControladorPersonal::class, 'store']);
    Route::get('personal/{id}', [ControladorPersonal::class, 'show']);
    Route::put('personal/{id}', [ControladorPersonal::class, 'update']);
    Route::patch('personal/{id}/toggle-activo', [ControladorPersonal::class, 'toggleActivo']);
    Route::delete('personal/{id}', [ControladorPersonal::class, 'destroy']);
});
