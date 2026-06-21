<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    require base_path('app/Modules/Areas/routes.php');
    require base_path('app/Modules/Patients/routes.php');
    require base_path('app/Modules/TiposExamenes/routes.php');
    require base_path('app/Modules/ExamenesPacientes/routes.php');
    require base_path('app/Modules/Consultorios/routes.php');
    require base_path('app/Modules/Turns/routes.php');
    require base_path('app/Modules/Display/routes.php');
    require base_path('app/Modules/Admin/routes.php');
    require base_path('app/Modules/Dashboard/routes.php');
});
