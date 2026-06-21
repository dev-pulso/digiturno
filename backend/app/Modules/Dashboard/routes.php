<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Dashboard\Controllers\ControladorDashboard;

Route::get('dashboard/resumen', [ControladorDashboard::class, 'resumen']);
Route::get('dashboard/alertas', [ControladorDashboard::class, 'alertas']);
Route::get('dashboard/tendencia-horaria', [ControladorDashboard::class, 'tendenciaHoraria']);
