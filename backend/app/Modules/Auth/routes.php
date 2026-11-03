<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Auth\Controllers\ControladorAuth;

Route::prefix('auth')->group(function () {
    Route::post('login', [ControladorAuth::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth.consalud')->group(function () {
        Route::post('logout', [ControladorAuth::class, 'logout']);
        Route::get('me', [ControladorAuth::class, 'me']);
    });
});
