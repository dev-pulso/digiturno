<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Admin\Controllers\ControladorVideo;

Route::get('videos/playlist', [ControladorVideo::class, 'playlist']);
Route::post('videos/reordenar', [ControladorVideo::class, 'reorder']);
Route::post('videos/{video}/toggle', [ControladorVideo::class, 'toggle']);
Route::apiResource('videos', ControladorVideo::class)->except(['create', 'edit']);
