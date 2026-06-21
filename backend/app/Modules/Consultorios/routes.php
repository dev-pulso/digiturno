<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Consultorios\Controllers\ControladorConsultorio;

Route::get('consultorios/{area}/cola', [ControladorConsultorio::class, 'cola']);
Route::post('consultorios/{area}/llamar-siguiente', [ControladorConsultorio::class, 'llamarSiguiente']);
Route::get('consultorios/{area}/actual', [ControladorConsultorio::class, 'actual']);
Route::get('consultorios/{area}/historial', [ControladorConsultorio::class, 'historial']);
