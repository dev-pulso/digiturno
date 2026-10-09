<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Admin\Controllers\ControladorVideo;

Route::get('videos/playlist', [ControladorVideo::class, 'playlist']);
Route::post('videos/reordenar', [ControladorVideo::class, 'reorder'])->middleware('throttle:20,1');
Route::post('videos/{video}/toggle', [ControladorVideo::class, 'toggle'])->middleware('throttle:20,1');
Route::apiResource('videos', ControladorVideo::class)->except(['create', 'edit'])->middleware('throttle:20,1');
