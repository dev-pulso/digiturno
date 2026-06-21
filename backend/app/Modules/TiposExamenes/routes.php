<?php

use Illuminate\Support\Facades\Route;
use App\Modules\TiposExamenes\Controllers\ControladorTipoExamen;

Route::apiResource('tipos-examenes', ControladorTipoExamen::class)->except(['create', 'edit']);
