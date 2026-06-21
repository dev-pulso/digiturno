<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Turns\Controllers\ControladorTurno;

Route::get('turnos', [ControladorTurno::class, 'index']);
Route::post('turnos', [ControladorTurno::class, 'store']);
Route::get('turnos/{turno}', [ControladorTurno::class, 'show']);
Route::post('turnos/{turno}/llamar', [ControladorTurno::class, 'llamar']);
Route::post('turnos/{turno}/rellamar', [ControladorTurno::class, 'rellamar']);
Route::post('turnos/{turno}/completar', [ControladorTurno::class, 'completar']);
Route::post('turnos/{turno}/ausente', [ControladorTurno::class, 'ausente']);
Route::post('turnos/{turno}/cancelar', [ControladorTurno::class, 'cancelar']);
