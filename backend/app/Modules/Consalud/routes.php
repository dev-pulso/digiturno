<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Consalud\Controllers\ControladorConsaludAsignacion;

Route::post('consalud/asignar-turnos', [ControladorConsaludAsignacion::class, 'asignarTurnos']);
