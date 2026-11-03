<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Turns\Controllers\ControladorTurno;

Route::get('display/todas', [ControladorTurno::class, 'displayTodas']);
Route::get('display/{area}', [ControladorTurno::class, 'displayByArea']);
