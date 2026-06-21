<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ExamenesPacientes\Controllers\ControladorExamenPaciente;

Route::get('pacientes/{paciente}/examenes', [ControladorExamenPaciente::class, 'listarPorPaciente']);
Route::post('pacientes/{paciente}/examenes', [ControladorExamenPaciente::class, 'asignar']);
