<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SessionController;

Route::prefix('v1')->group(function () {
    Route::get('public/display', [\App\Modules\Turns\Controllers\ControladorTurno::class, 'displayTodas']);
    Route::get('public/videos/playlist', [\App\Modules\Admin\Controllers\ControladorVideo::class, 'playlist']);

    Route::middleware('consalud.auth')->group(function () {
        Route::get('session/me', [SessionController::class, 'show']);
        // Consultorios need to resolve their permitted area, but only admins
        // may change the catalogue.
        require base_path('app/Modules/Areas/routes.php');
        Route::middleware('consalud.permission:digiturno.recepcion')->group(function () {
    require base_path('app/Modules/Patients/routes.php');
    require base_path('app/Modules/TiposExamenes/routes.php');
    require base_path('app/Modules/ExamenesPacientes/routes.php');
        });
        Route::middleware('consalud.permission:digiturno.consultorio,area')->group(function () {
    require base_path('app/Modules/Consultorios/routes.php');
        });
        Route::middleware('consalud.permission:digiturno.consultorio')->group(function () {
    require base_path('app/Modules/Turns/routes.php');
        });
        Route::middleware('consalud.permission:digiturno.admin')->group(function () {
    require base_path('app/Modules/Admin/routes.php');
        });
        Route::middleware('consalud.permission:digiturno.dashboard')->group(function () {
    require base_path('app/Modules/Dashboard/routes.php');
    require base_path('app/Modules/Display/routes.php');
        });
        Route::middleware('consalud.permission:digiturno.recepcion')->group(function () {
    require base_path('app/Modules/Consalud/routes.php');
        });
    });
});
