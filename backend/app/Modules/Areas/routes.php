<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Areas\Controllers\ControladorArea;

Route::apiResource('areas', ControladorArea::class)->except(['create', 'edit']);
