<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Cliente\ClienteController;
use App\Http\Controllers\User\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\General\GeneralController;
use App\Http\Controllers\ExamenMigrationController;
use App\Http\Controllers\Procesos\AutorizacionController;
use App\Http\Controllers\Proveedor\ProveedorController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Historias\IngresoController;
use App\Http\Controllers\Historias\HistoriaClinicaController;
use App\Http\Controllers\Paciente\PacienteController;

Route::post('/migrate-exams', [ExamenMigrationController::class, 'migrate']);

Route::post('/migrate-convcups', [ExamenMigrationController::class, 'migrateConvcups']);

// Rutas de autenticación
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::middleware('auth:api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Rutas para gestión de clientes
Route::prefix('clientes')->middleware('auth:api')->group(function () {
    Route::get('/', [ClienteController::class, 'index']);        // Listar todos
    Route::get('/{id}', [ClienteController::class, 'show']);     // Obtener por ID
    Route::post('/', [ClienteController::class, 'store']);       // Crear o actualizar
    Route::post('/crear-clientes', [ClienteController::class, 'store']);
    Route::put('/{id}', [ClienteController::class, 'update']);
    Route::post('/soportes', [ClienteController::class, 'soportes']);
    Route::delete('/soportes/{id}', [ClienteController::class, 'eliminarSoporte']);

    // Sedes dentro de ClienteController

    // Listar sedes de un cliente
    Route::get('/{clienteId}/sedes', [ClienteController::class, 'listarSedes']);
    // Crear sede
    Route::post('/guardar-sedes', [ClienteController::class, 'crearSede']);
    // Actualizar sede
    Route::put('/sedes/{id}', [ClienteController::class, 'actualizarSede']);
    // Eliminar sede
    Route::delete('/sedes/{id}', [ClienteController::class, 'eliminarSede']);

    // Listar tarifas de un cliente
    Route::get('/{clienteId}/tarifas', [ClienteController::class, 'listarTarifas']);

    // Guardar tarifas (crear o actualizar en bloque)
    Route::post('/guardar-tarifas', [ClienteController::class, 'crearTarifa']);

    // Toggle del estado de una tarifa
    Route::patch('/tarifas/toggle-activa/{id}', [ClienteController::class, 'toggleTarifaActiva']);

    // Actualizar una tarifa específica
    Route::put('/tarifas/{id}', [ClienteController::class, 'actualizarTarifa']);

    // Eliminar una tarifa
    Route::delete('/tarifas/{id}', [ClienteController::class, 'eliminarTarifa']);

    // Crear empresa-labor
    Route::post('/guardar-empresa-labor', [ClienteController::class, 'crearEmpresaLabor']);
    Route::post('/toggle-empresa-labor', [ClienteController::class, 'toggleEmpresaLabor']);

    Route::patch('/toggle/{id}', [ClienteController::class, 'toggle']);
});

// Rutas para gestión de usuarios
Route::prefix('users')->middleware('auth:api')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    // Route::post('/', [UserController::class, 'store']);
    Route::post('/crear', [UserController::class, 'store']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
    Route::patch('/toggle-sedes-user/{id}', [UserController::class, 'toggleSedeUsuario']);
    Route::patch('/toggle-user-permiso/{id}', [UserController::class, 'toggleUserPermiso']);
    Route::patch('/toggle/{id}', [UserController::class, 'toggle']);
    Route::patch('/change-password', [UserController::class, 'changePassword']);
    Route::post('/{id}/foto', [UserController::class, 'subirFoto']);
    Route::post('/{id}/firma', [UserController::class, 'subirFirma']);
});

Route::prefix('general')->middleware('auth:api')->group(function () {
    Route::get('/clientes', [GeneralController::class, 'index']);
    Route::get('/proveedores', [GeneralController::class, 'indexProveedores']);
    Route::get('/autorizaciones', [GeneralController::class, 'indexAutorizacion']);
    Route::get('/ingresos', [GeneralController::class, 'indexIngresos']);
    Route::get('/users', [GeneralController::class, 'indexUsuarios']);

    Route::get('/examenes', [GeneralController::class, 'indexExamenes']);
    Route::get('/pacientes/search', [GeneralController::class, 'searchPacientes']);
    Route::post('/cargos/crear', [GeneralController::class, 'crearCargo']);
});

// Rutas para gestión de proveedores
Route::prefix('proveedores')->middleware('auth:api')->group(function () {
    Route::get('/', [ProveedorController::class, 'index']);        // Listar todos
    Route::get('/{id}', [ProveedorController::class, 'show']);     // Obtener por ID
    Route::post('/', [ProveedorController::class, 'store']);       // Crear o actualizar
    Route::post('/crear-proveedores', [ProveedorController::class, 'store']);
    Route::put('/{id}', [ProveedorController::class, 'update']);
    Route::post('/soportes', [ProveedorController::class, 'soportes']);
    Route::delete('/soportes/{id}', [ProveedorController::class, 'eliminarSoporte']);

    // Sedes dentro de ProveedorController

    // Listar sedes de un proveedor
    Route::get('/{proveedorId}/sedes', [ProveedorController::class, 'listarSedes']);
    // Crear sede
    Route::post('/guardar-sedes', [ProveedorController::class, 'crearSede']);
    // Actualizar sede
    Route::put('/sedes/{id}', [ProveedorController::class, 'actualizarSede']);
    // Eliminar sede
    Route::delete('/sedes/{id}', [ProveedorController::class, 'eliminarSede']);

    // Listar tarifas de un proveedor
    Route::get('/{proveedorId}/tarifas', [ProveedorController::class, 'listarTarifas']);

    // Guardar tarifas (crear o actualizar en bloque)
    Route::post('/guardar-tarifas', [ProveedorController::class, 'crearTarifa']);

    // Actualizar una tarifa específica
    Route::put('/tarifas/{id}', [ProveedorController::class, 'actualizarTarifa']);

    // Eliminar una tarifa
    Route::delete('/tarifas/{id}', [ProveedorController::class, 'eliminarTarifa']);

    // Toggle del estado de una tarifa
    Route::patch('/tarifas/toggle-activa/{id}', [ProveedorController::class, 'toggleTarifaActiva']);

    Route::patch('/toggle/{id}', [ProveedorController::class, 'toggle']);
});

Route::prefix('procesos')->middleware('auth:api')->group(function () {

    Route::prefix('autorizaciones')->group(function () {
        // Listar todas las autorizaciones
        Route::get('/', [AutorizacionController::class, 'index']);

        // 🔹 PDF de relación de autorizaciones (debe ir antes de /{id})
        Route::get('/relacion-pdf', [AutorizacionController::class, 'relacionPdf']);

        // 🔹 Informe de ventas (debe ir antes de /{id})
        Route::get('/informe-ventas', [AutorizacionController::class, 'informeVentas']);
        Route::get('/informe-ventas-pdf', [AutorizacionController::class, 'informeVentasPdf']);

        // Obtener autorización por ID
        Route::get('/{id}', [AutorizacionController::class, 'show']);

        // Crear nueva autorización
        Route::post('/crear', [AutorizacionController::class, 'store']);

        // Editar autorización
        Route::put('/editar/{id}', [AutorizacionController::class, 'update']);

        // Eliminar autorización
        Route::delete('/eliminar/{id}', [AutorizacionController::class, 'destroy']);
        Route::delete('/{autorizacion}/pacientes/{pivot}', [AutorizacionController::class, 'destroyPaciente']);

        Route::get('/{autorizacion}/pdf', [AutorizacionController::class, 'pdf']);
        // Route::get('/{autorizacion}/pacientes/{pivot}/pdf', [AutorizacionController::class, 'pdfPaciente']);
        Route::get('/{autorizacion}/pacientes/{pivot}/pdf', [AutorizacionController::class, 'pdfPaciente'])
            ->whereNumber('autorizacion')
            ->whereNumber('pivot');

        // 🔹 Subir y eliminar archivos de resultados de exámenes
        Route::post('/archivos', [AutorizacionController::class, 'storeSubirArchivo']);
        Route::delete('/archivos/{id}', [AutorizacionController::class, 'destroyArchivo']);


        // 🔹 Facturar autorización completa
        Route::post('/facturar/{id}', [AutorizacionController::class, 'facturar']);

        // 🔹 Facturar paciente dentro de una autorización
        Route::post('/{autorizacion}/pacientes/{pivot}/facturar', [AutorizacionController::class, 'facturarPaciente'])
            ->whereNumber('autorizacion')
            ->whereNumber('pivot');

        // 🔹 Marcar como realizado autorización completa
        Route::post('/realizado/{id}', [AutorizacionController::class, 'marcarRealizado']);

        // 🔹 Marcar como realizado paciente dentro de una autorización
        Route::post('/{autorizacion}/pacientes/{pivot}/realizado', [AutorizacionController::class, 'marcarRealizadoPaciente'])
            ->whereNumber('autorizacion')
            ->whereNumber('pivot');

        // 🔹 Modificar fecha de autorización
        Route::put('/{id}/modificar-fecha', [AutorizacionController::class, 'modificarFecha'])
            ->whereNumber('id');
    });
});

// Rutas para el Dashboard 
Route::prefix('dashboard')->middleware('auth:api')->group(function () { 
    // Obtiene el resumen de estadísticas 
    Route::get('/summary', [DashboardController::class, 'summary']); 
    // Obtiene las actividades recientes 
    Route::get('/recent-activity', [DashboardController::class, 'recentActivity']); 
    // Obtiene los clientes activos 
    Route::get('/active-clients', [DashboardController::class, 'activeClients']); 
    // Obtiene toda la información del dashboard (resumen + actividades + clientes) 
    Route::get('/', [DashboardController::class, 'all']); 
});

// Rutas para Historias
Route::prefix('historias')->middleware('auth:api')->group(function () {

    // ==============================
    // 📌 GESTIÓN DE INGRESOS (LISTADO)
    // ==============================
    Route::get('/ingresos/gestion', [IngresoController::class, 'gestion'])
        ->name('historias.ingresos.gestion');

    // Obtener detalle del ingreso desde autorización + paciente
    Route::get('/ingresos/detalle', [IngresoController::class, 'detalle']);

    // Estado de historia clínica por ingreso(s)
    Route::get('/ingresos/historia-status', [IngresoController::class, 'historiaStatus'])
        ->name('historias.ingresos.historia-status');

    // ==============================
    // 📌 NUEVO: CREAR INGRESO COMPLETO
    // ==============================
    Route::post('/ingresos', [IngresoController::class, 'store'])
        ->name('historias.ingresos.store');

    // ==============================
    // 📌 NUEVO: OBTENER INGRESO POR ID
    // ==============================
    Route::get('/ingresos/{id}', [IngresoController::class, 'show'])
        ->whereNumber('id')
        ->name('historias.ingresos.show');

    // ==============================
    // 📌 NUEVO: EDITAR INGRESO
    // ==============================
    Route::put('/ingresos/{id}', [IngresoController::class, 'update'])
        ->whereNumber('id')
        ->name('historias.ingresos.update');

    // ==============================
    // 📌 NUEVO: ELIMINAR INGRESO
    // ==============================
    Route::delete('/ingresos/{id}', [IngresoController::class, 'destroy'])
        ->whereNumber('id')
        ->name('historias.ingresos.destroy');

    // ==============================
    // 📌 NUEVO: EXPORTAR PDF DE INGRESO (REMISIÓN)
    // ==============================
    Route::get('/ingresos/{id}/pdf-proveedores', [IngresoController::class, 'pdfProveedores'])
        ->whereNumber('id')
        ->name('historias.ingresos.pdf-proveedores');

    Route::get('/ingresos/{id}/pdf', [IngresoController::class, 'pdf'])
        ->whereNumber('id')
        ->name('historias.ingresos.pdf');

    Route::put('/ingresos/{id}/modificar-fecha', [IngresoController::class, 'modificarFecha'])
        ->whereNumber('id')
        ->name('historias.ingresos.modificar-fecha');

    Route::post('/ingresos/{id}/foto', [IngresoController::class, 'subirFoto'])
        ->whereNumber('id')
        ->name('historias.ingresos.foto');

    Route::post('/ingresos/{id}/firma', [IngresoController::class, 'subirFirma'])
        ->whereNumber('id')
        ->name('historias.ingresos.firma');

    // ==============================
    // 📁 CERTIFICADOS DEL INGRESO
    // ==============================
    Route::get('/ingresos/certificados/{ingresoId}/{pacienteId}', [IngresoController::class, 'indexCertificados'])
        ->whereNumber(['ingresoId', 'pacienteId'])
        ->name('historias.ingresos.certificados.index');

    Route::post('/ingresos/certificados', [IngresoController::class, 'storeSubirCertificado'])
        ->name('historias.ingresos.certificados.store');

    Route::delete('/ingresos/certificados/{id}', [IngresoController::class, 'destroyCertificado'])
        ->whereNumber('id')
        ->name('historias.ingresos.certificados.destroy');

    // ==============================
    // 📋 CATEGORÍAS DE EXAMEN
    // ==============================
    Route::get('/categoria-examen', [IngresoController::class, 'indexCategoriasExamen'])
        ->name('historias.categoria-examen.index');

    // ==============================
    // HISTORIA CLÍNICA
    // ==============================

    // Examen físico (rutas específicas ANTES de la ruta con {id})
    Route::get('/historia-clinica/examen-fisico/{ingresoId}', [HistoriaClinicaController::class, 'showExamenFisicoByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.historia-clinica.examen-fisico.show');

    Route::post('/historia-clinica/examen-fisico', [HistoriaClinicaController::class, 'storeExamenFisico'])
        ->name('historias.historia-clinica.examen-fisico.store');

    Route::put('/historia-clinica/examen-fisico/{id}', [HistoriaClinicaController::class, 'updateExamenFisico'])
        ->whereNumber('id')
        ->name('historias.historia-clinica.examen-fisico.update');

    // Historia Clínica PDF
    Route::get('/historia-clinica/{ingresoId}/pdf', [HistoriaClinicaController::class, 'historiaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.historia-clinica.pdf');

    // CRUD Historia Clínica
    Route::post('/historia-clinica', [HistoriaClinicaController::class, 'store'])
        ->name('historias.historia-clinica.store');

    Route::get('/historia-clinica/{ingresoId}', [HistoriaClinicaController::class, 'showByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.historia-clinica.show');

    Route::delete('/historia-clinica/{id}', [HistoriaClinicaController::class, 'destroy'])
        ->whereNumber('id')
        ->name('historias.historia-clinica.destroy');

    // ==============================
    // EXAMEN FÍSICO (rutas independientes)
    // ==============================
    Route::get('/examen-fisico/{ingresoId}', [HistoriaClinicaController::class, 'showExamenFisicoByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.examen-fisico.show');

    Route::post('/examen-fisico', [HistoriaClinicaController::class, 'storeExamenFisico'])
        ->name('historias.examen-fisico.store');

    Route::put('/examen-fisico/{id}', [HistoriaClinicaController::class, 'updateExamenFisico'])
        ->whereNumber('id')
        ->name('historias.examen-fisico.update');

    // ==============================
    // INFORMACIÓN OCUPACIONAL
    // ==============================
    Route::get('/inf-ocupacional/{ingresoId}', [HistoriaClinicaController::class, 'showInfOcupacionalByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.inf-ocupacional.show');

    Route::post('/inf-ocupacional', [HistoriaClinicaController::class, 'storeInfOcupacional'])
        ->name('historias.inf-ocupacional.store');

    Route::put('/inf-ocupacional/{id}', [HistoriaClinicaController::class, 'updateInfOcupacional'])
        ->whereNumber('id')
        ->name('historias.inf-ocupacional.update');

    // ==============================
    // INMUNO-TÓXICO
    // ==============================
    Route::get('/inmuno-toxico/{ingresoId}', [HistoriaClinicaController::class, 'showInmunoToxicoByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.inmuno-toxico.show');

    Route::post('/inmuno-toxico', [HistoriaClinicaController::class, 'storeInmunoToxico'])
        ->name('historias.inmuno-toxico.store');

    Route::put('/inmuno-toxico/{id}', [HistoriaClinicaController::class, 'updateInmunoToxico'])
        ->whereNumber('id')
        ->name('historias.inmuno-toxico.update');

    // ==============================
    // ANTECEDENTES CLÍNICOS
    // ==============================
    Route::get('/antecedentes-catalogo/{tipoId}', [HistoriaClinicaController::class, 'getAntecedentesCatalogo'])
        ->whereNumber('tipoId')
        ->name('historias.antecedentes-catalogo.show');

    Route::get('/antecedentes-clinicos/{ingresoId}', [HistoriaClinicaController::class, 'showAntecedentesClinicosByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.antecedentes-clinicos.show');

    Route::post('/antecedentes-clinicos', [HistoriaClinicaController::class, 'storeAntecedentesClinico'])
        ->name('historias.antecedentes-clinicos.store');

    Route::put('/antecedentes-clinicos/{id}', [HistoriaClinicaController::class, 'updateAntecedentesClinico'])
        ->whereNumber('id')
        ->name('historias.antecedentes-clinicos.update');

    // ==============================
    // PELIGROS
    // ==============================
    Route::get('/peligros', [HistoriaClinicaController::class, 'getPeligros'])
        ->name('historias.peligros.index');

    // ==============================
    // CIE10
    // ==============================
    Route::get('/cie10', [HistoriaClinicaController::class, 'buscarCie10'])
        ->name('historias.cie10.buscar');

    // ==============================
    // ANTECEDENTES LABORALES
    // ==============================
    Route::get('/antecedentes-laborales/{ingresoId}', [HistoriaClinicaController::class, 'showAntecedentesLaboralesByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.antecedentes-laborales.show');

    Route::post('/antecedentes-laborales', [HistoriaClinicaController::class, 'storeAntecedentesLaborales'])
        ->name('historias.antecedentes-laborales.store');

    Route::put('/antecedentes-laborales/{id}', [HistoriaClinicaController::class, 'updateAntecedentesLaborales'])
        ->whereNumber('id')
        ->name('historias.antecedentes-laborales.update');

    // CONDICIONES LABORALES
    Route::get('/condiciones-laborales/{ingresoId}', [HistoriaClinicaController::class, 'showCondicionesLaboralesByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.condiciones-laborales.show');
    Route::post('/condiciones-laborales', [HistoriaClinicaController::class, 'storeCondicionesLaborales'])
        ->name('historias.condiciones-laborales.store');
    Route::put('/condiciones-laborales/{id}', [HistoriaClinicaController::class, 'updateCondicionesLaborales'])
        ->whereNumber('id')
        ->name('historias.condiciones-laborales.update');

    // ==============================
    // RECOMENDACIONES
    // ==============================
    Route::get('/recomendaciones/catalogo', [HistoriaClinicaController::class, 'getCatalogoRecomendaciones'])
        ->name('historias.recomendaciones.catalogo');

    Route::get('/recomendaciones/{ingresoId}', [HistoriaClinicaController::class, 'getRecomendacionesByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.recomendaciones.show');

    Route::post('/recomendaciones', [HistoriaClinicaController::class, 'storeRecomendaciones'])
        ->name('historias.recomendaciones.store');

    // ==============================
    // CONCEPTO — DIAGNÓSTICOS
    // ==============================
    Route::get('/concepto-diagnosticos/{ingresoId}', [HistoriaClinicaController::class, 'getConceptoDiagnosticosByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.concepto-diagnosticos.show');

    Route::post('/concepto-diagnosticos', [HistoriaClinicaController::class, 'storeConceptoDiagnosticos'])
        ->name('historias.concepto-diagnosticos.store');

    // ==============================
    // CONCEPTO — APTITUD LABORAL
    // ==============================
    Route::get('/concepto-aptitud/{ingresoId}', [HistoriaClinicaController::class, 'getConceptoAptitudByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.concepto-aptitud.show');

    Route::post('/concepto-aptitud', [HistoriaClinicaController::class, 'storeConceptoAptitud'])
        ->name('historias.concepto-aptitud.store');

    Route::get('/concepto/{ingresoId}/pdf', [HistoriaClinicaController::class, 'conceptoPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.concepto.pdf');

    Route::get('/revision-sistemas/{ingresoId}', [HistoriaClinicaController::class, 'showRevisionSistemasByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.revision-sistemas.show');
    Route::post('/revision-sistemas', [HistoriaClinicaController::class, 'storeRevisionSistemas'])
        ->name('historias.revision-sistemas.store');
    Route::put('/revision-sistemas/{id}', [HistoriaClinicaController::class, 'updateRevisionSistemas'])
        ->whereNumber('id')
        ->name('historias.revision-sistemas.update');

    // PRUEBA PSICOLÓGICA DE ALTURA
    Route::get('/prueba-psicologica-altura/{ingresoId}', [HistoriaClinicaController::class, 'showPruebaPsicologicaAlturaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.prueba-psicologica-altura.show');
    Route::post('/prueba-psicologica-altura', [HistoriaClinicaController::class, 'storePruebaPsicologicaAltura'])
        ->name('historias.prueba-psicologica-altura.store');
    Route::put('/prueba-psicologica-altura/{id}', [HistoriaClinicaController::class, 'updatePruebaPsicologicaAltura'])
        ->whereNumber('id')
        ->name('historias.prueba-psicologica-altura.update');

    // AUDIOMETRÍA
    Route::get('/audiometria/{ingresoId}', [HistoriaClinicaController::class, 'showAudiometriaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.audiometria.show');
    Route::post('/audiometria', [HistoriaClinicaController::class, 'storeAudiometria'])
        ->name('historias.audiometria.store');
    Route::put('/audiometria/{id}', [HistoriaClinicaController::class, 'updateAudiometria'])
        ->whereNumber('id')
        ->name('historias.audiometria.update');
    Route::post('/audiometria/{audiometriaId}/soportes', [HistoriaClinicaController::class, 'storeAudiometriaSoporte'])
        ->whereNumber('audiometriaId')
        ->name('historias.audiometria.soportes.store');
    Route::delete('/audiometria/soportes/{id}', [HistoriaClinicaController::class, 'destroyAudiometriaSoporte'])
        ->whereNumber('id')
        ->name('historias.audiometria.soportes.destroy');
    Route::get('/audiometria/{ingresoId}/pdf', [HistoriaClinicaController::class, 'audiometriaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.audiometria.pdf');

    // OPTOMETRÍA
    Route::get('/optometria/{ingresoId}', [HistoriaClinicaController::class, 'showOptometriaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.optometria.show');
    Route::post('/optometria', [HistoriaClinicaController::class, 'storeOptometria'])
        ->name('historias.optometria.store');
    Route::put('/optometria/{id}', [HistoriaClinicaController::class, 'updateOptometria'])
        ->whereNumber('id')
        ->name('historias.optometria.update');
    Route::get('/optometria/{ingresoId}/pdf', [HistoriaClinicaController::class, 'optometriaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.optometria.pdf');

    // ESPIROMETRÍA
    Route::get('/espirometria/{ingresoId}', [HistoriaClinicaController::class, 'showEspirometriaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.espirometria.show');
    Route::post('/espirometria', [HistoriaClinicaController::class, 'storeEspirometria'])
        ->name('historias.espirometria.store');
    Route::put('/espirometria/{id}', [HistoriaClinicaController::class, 'updateEspirometria'])
        ->whereNumber('id')
        ->name('historias.espirometria.update');
    Route::get('/espirometria/{ingresoId}/pdf', [HistoriaClinicaController::class, 'espirometriaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.espirometria.pdf');

    // VISIOMETRÍA
    Route::get('/visiometria/{ingresoId}', [HistoriaClinicaController::class, 'showVisiometriaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.visiometria.show');
    Route::post('/visiometria', [HistoriaClinicaController::class, 'storeVisiometria'])
        ->name('historias.visiometria.store');
    Route::put('/visiometria/{id}', [HistoriaClinicaController::class, 'updateVisiometria'])
        ->whereNumber('id')
        ->name('historias.visiometria.update');
    Route::get('/visiometria/{ingresoId}/pdf', [HistoriaClinicaController::class, 'visiometriaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.visiometria.pdf');

    // LABORATORIO CLÍNICO
    Route::get('/laboratorio/examenes', [HistoriaClinicaController::class, 'showExamenesLaboratorio'])
        ->name('historias.laboratorio.examenes');
    Route::get('/laboratorio/{ingresoId}', [HistoriaClinicaController::class, 'showLaboratorioByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.laboratorio.show');
    Route::post('/laboratorio', [HistoriaClinicaController::class, 'storeLaboratorio'])
        ->name('historias.laboratorio.store');
    Route::put('/laboratorio/{id}', [HistoriaClinicaController::class, 'updateLaboratorio'])
        ->whereNumber('id')
        ->name('historias.laboratorio.update');

    // RADIOGRAFÍA
    Route::get('/radiografia/examenes', [HistoriaClinicaController::class, 'showExamenesRadiografia'])
        ->name('historias.radiografia.examenes');
    Route::get('/radiografia/{ingresoId}', [HistoriaClinicaController::class, 'showRadiografiaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.radiografia.show');
    Route::post('/radiografia', [HistoriaClinicaController::class, 'storeRadiografia'])
        ->name('historias.radiografia.store');
    Route::put('/radiografia/{id}', [HistoriaClinicaController::class, 'updateRadiografia'])
        ->whereNumber('id')
        ->name('historias.radiografia.update');

    // PRUEBA PSICOSENSOMÉTRICA
    Route::get('/prueba-psicosensometrica/{ingresoId}', [HistoriaClinicaController::class, 'showPruebaPsicosensometricaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.prueba-psicosensometrica.show');
    Route::post('/prueba-psicosensometrica', [HistoriaClinicaController::class, 'storePruebaPsicosensometrica'])
        ->name('historias.prueba-psicosensometrica.store');
    Route::put('/prueba-psicosensometrica/{id}', [HistoriaClinicaController::class, 'updatePruebaPsicosensometrica'])
        ->whereNumber('id')
        ->name('historias.prueba-psicosensometrica.update');
    Route::post('/prueba-psicosensometrica/{psicosensometricaId}/soportes', [HistoriaClinicaController::class, 'storePruebaPsicosensometricaSoporte'])
        ->whereNumber('psicosensometricaId')
        ->name('historias.prueba-psicosensometrica.soportes.store');
    Route::delete('/prueba-psicosensometrica/soportes/{id}', [HistoriaClinicaController::class, 'destroyPruebaPsicosensometricaSoporte'])
        ->whereNumber('id')
        ->name('historias.prueba-psicosensometrica.soportes.destroy');
    Route::get('/prueba-psicosensometrica/{ingresoId}/pdf', [HistoriaClinicaController::class, 'pruebaPsicosensometricaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.prueba-psicosensometrica.pdf');

    // ELECTROCARDIOGRAMA
    Route::get('/electrocardiograma/{ingresoId}', [HistoriaClinicaController::class, 'showElectrocardiogramaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.electrocardiograma.show');
    Route::post('/electrocardiograma', [HistoriaClinicaController::class, 'storeElectrocardiograma'])
        ->name('historias.electrocardiograma.store');
    Route::put('/electrocardiograma/{id}', [HistoriaClinicaController::class, 'updateElectrocardiograma'])
        ->whereNumber('id')
        ->name('historias.electrocardiograma.update');
    Route::post('/electrocardiograma/{electrocardiogramaId}/soportes', [HistoriaClinicaController::class, 'storeElectrocardiogramaSoporte'])
        ->whereNumber('electrocardiogramaId')
        ->name('historias.electrocardiograma.soportes.store');
    Route::delete('/electrocardiograma/soportes/{id}', [HistoriaClinicaController::class, 'destroyElectrocardiogramaSoporte'])
        ->whereNumber('id')
        ->name('historias.electrocardiograma.soportes.destroy');
    Route::get('/electrocardiograma/{ingresoId}/pdf', [HistoriaClinicaController::class, 'electrocardiogramaPdf'])
        ->whereNumber('ingresoId')
        ->name('historias.electrocardiograma.pdf');

    // ── Segunda Instancia ──────────────────────────────────────────────────
    Route::get('/segunda-instancia/{ingresoId}', [HistoriaClinicaController::class, 'getSegundaInstanciaByIngreso'])
        ->whereNumber('ingresoId')
        ->name('historias.segunda-instancia.show');

    Route::post('/segunda-instancia', [HistoriaClinicaController::class, 'storeSegundaInstancia'])
        ->name('historias.segunda-instancia.store');

    // SECCIONES ESTADO
    Route::get('/secciones-estado/{ingresoId}/{tipoSeccion}/history', [HistoriaClinicaController::class, 'historySeccionEstado'])
        ->whereNumber('ingresoId')
        ->name('historias.secciones-estado.history');
    Route::get('/secciones-estado/{ingresoId}/{tipoSeccion}', [HistoriaClinicaController::class, 'showSeccionEstado'])
        ->whereNumber('ingresoId')
        ->name('historias.secciones-estado.show');
    Route::post('/secciones-estado', [HistoriaClinicaController::class, 'storeSeccionEstado'])
        ->name('historias.secciones-estado.store');

});

// Rutas para Pacientes
Route::prefix('pacientes')->middleware('auth:api')->group(function () {
    // Listar todos los pacientes
    Route::get('/', [PacienteController::class, 'index'])
        ->name('pacientes.index');

    // Listado paginado para gestión (DEBE ir ANTES de /{id})
    Route::get('/gestion', [PacienteController::class, 'gestion'])
        ->name('pacientes.gestion');

    // Buscar pacientes por término
    Route::get('/buscar', [PacienteController::class, 'buscar'])
        ->name('pacientes.buscar');

    // Obtener paciente por ID
    Route::get('/{id}', [PacienteController::class, 'show'])
        ->whereNumber('id')
        ->name('pacientes.show');

    // Crear paciente
    Route::post('/', [PacienteController::class, 'store'])
        ->name('pacientes.store');

    // Actualizar paciente
    Route::put('/{id}', [PacienteController::class, 'update'])
        ->whereNumber('id')
        ->name('pacientes.update');

    // Eliminar (inactivar) paciente
    Route::delete('/{id}', [PacienteController::class, 'destroy'])
        ->whereNumber('id')
        ->name('pacientes.destroy');

    // Subir/actualizar foto del paciente
    Route::post('/{id}/foto', [PacienteController::class, 'subirFoto'])
        ->whereNumber('id')
        ->name('pacientes.foto');

    // Subir/actualizar firma del paciente
    Route::post('/{id}/firma', [PacienteController::class, 'subirFirma'])
        ->whereNumber('id')
        ->name('pacientes.firma');
});
