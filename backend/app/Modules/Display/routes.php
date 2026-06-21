<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Turns\Controllers\ControladorTurno;
use App\Modules\Display\Controllers\TtsController;

Route::get('display/todas', [ControladorTurno::class, 'displayTodas']);
Route::get('display/{area}', [ControladorTurno::class, 'displayByArea']);
Route::post('tts/anunciar', [TtsController::class, 'anunciar']);
