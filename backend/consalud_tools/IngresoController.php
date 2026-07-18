<?php

namespace App\Http\Controllers\Historias;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Application\DTOs\Procesos\AutorizacionDto;
use Symfony\Component\HttpKernel\Exception\HttpException;

use App\Application\Services\Historias\IngresoService;
use App\Application\Services\Historias\IngresoPdfService;
use App\Application\Services\Historias\IngresoCertificadoService;
use App\Application\DTOs\Historias\IngresoDto;
use App\Domain\Entities\Historias\Ingreso as IngresoEntity;
use App\Domain\Entities\Historias\IngresoCertificado as IngresoCertificadoEntity;
use App\Http\Requests\Historias\IngresoRequest;
use App\Http\Requests\Historias\IngresoCertificadoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

use App\Infrastructure\Models\Historias\Ingreso as IngresoModel;
use App\Infrastructure\Models\Historias\ExamenFisico as ExamenFisicoModel;
use App\Infrastructure\Models\Historias\Visiometria as VisiometriaModel;
use App\Infrastructure\Models\Historias\Audiometria as AudiometriaModel;
use App\Infrastructure\Models\Historias\Espirometria as EspirometriaModel;
use App\Infrastructure\Models\Historias\Optometria as OptometriaModel;
use App\Infrastructure\Models\Historias\LaboratorioClinico as LaboratorioClinicoModel;
use App\Infrastructure\Models\Historias\Radiografia as RadiografiaModel;
use App\Infrastructure\Models\Historias\PruebaPsicosensometrica as PruebaPsicosensometricaModel;
use App\Infrastructure\Models\Paciente\Paciente as PacienteModel;
use App\Infrastructure\Models\Cliente\Examen as ExamenModel;
use App\Infrastructure\Models\Cliente\CategoriaExamen;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class IngresoController extends Controller
{
    public function __construct(
        protected IngresoService              $ingresoService,
        protected IngresoCertificadoService   $ingresoCertificadoService,
    ) {}

    /**
     * Listado de ingresos para la pantalla de gestión.
     * GET /api/historias/ingresos/gestion?fecha_inicio=...&fecha_fin=...
     */
    public function gestion(Request $request): JsonResponse
    {
        $fechaInicio = $request->get('fecha_inicio');
        $fechaFin    = $request->get('fecha_fin');
        $clienteId   = $request->get('cliente_id') ? (int) $request->get('cliente_id') : null;
        $busqueda    = $request->get('busqueda') ? trim($request->get('busqueda')) : null;

        $user = auth('api')->user() ?? auth()->user();

        // Admin (role_id = 1) y Asesor (role_id = 2) ven todo
        // Profesional Medico Cliente (role_id = 7) filtra por sus sedes asociadas
        // Otros roles filtran por sus especialidades
        $especialidadIds = null;
        $sedeIds = null;
        if ($user && $user->role_id !== 1 && $user->role_id !== 2) {
            if ($user->role_id === 7) {
                $sedeIds = $user->sedesUsers()->where('estado', 1)->pluck('sede_id')->toArray();
            } else {
                $especialidadIds = $user->especialidades()->pluck('categoria_exam.id')->toArray();
            }
        }

        $items = $this->ingresoService->getAll($fechaInicio, $fechaFin, $clienteId, $busqueda, $especialidadIds, $sedeIds);

        $mapped = array_map(
            fn ($item) => IngresoDto::fromEntityWithModel($item['entity'], $item['model']),
            $items
        );

        // 🔹 Aquí devolvemos directamente el array, sin clave "ingresos"
        return response()->json($mapped);
    }    

    /**
     * Obtener los datos del ingreso por autorización + paciente.
     */

    /**
     * Obtener los datos del ingreso por autorización + paciente.
     * Devuelve una Autorización completa en el mismo formato que AutorizacionController.
     */
    public function detalle(Request $request)
    {
        $request->validate([
            'autorizacion_id' => 'required|integer',
            'paciente_id'     => 'required|integer',
        ]);

        $autorizacionId = $request->input('autorizacion_id');
        $pacienteId     = $request->input('paciente_id');

        // 🔹 Obtenemos la autorización completa desde el servicio de ingreso
        $autorizacion = $this->ingresoService->obtenerIngresoPorAutorizacionYPaciente(
            $autorizacionId,
            $pacienteId
        );

        if (!$autorizacion) {
            throw new HttpException(404, 'Ingreso no encontrado para los IDs proporcionados.');
        }

        // 🔹 Transformamos la entidad + modelo a DTO de Autorizacion
        $dto = AutorizacionDto::fromEntityWithModel(
            $autorizacion['entity'], 
            $autorizacion['model']
        );

        return response()->json(['autorizacion' => $dto], 200);
    }

    public function show(int $id): JsonResponse
    {
        $item = $this->ingresoService->getById($id);

        if (!$item) {
            return response()->json(['message' => 'Ingreso no encontrado'], 404);
        }

        $ingresoDto = IngresoDto::fromEntityWithModel($item['entity'], $item['model']);
        
        // Extraer examenes del DTO y devolverlos por separado
        $examenes = $ingresoDto['examenes'] ?? [];
        
        return response()->json([
            'ingreso' => $ingresoDto,
            'examenes' => $examenes,
        ]);
    }

    public function store(IngresoRequest $request): JsonResponse
    {
        try {
            $data        = $request->validated();
            $ingresoData = $data['ingreso']  ?? [];
            $paciente    = $data['paciente'] ?? [];
            $examenes    = $data['examenes'] ?? [
                'nuevos' => [],
                'existentes' => [],
                'eliminados' => [],
            ];

            $result = $this->ingresoService->save($ingresoData, $paciente, $examenes);
            $ingresoModel = $result['ingreso'];
            $pacienteModel = $result['paciente'];

            // Reconstruir entidad para el DTO
            $item = $this->ingresoService->getById($ingresoModel->id);

            return response()->json([
                'message' => 'Ingreso guardado correctamente',
                'ingreso' => IngresoDto::fromEntityWithModel($item['entity'], $item['model']),
                'paciente' => $pacienteModel,
                'examenes' => [],
            ], 201);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('Error al guardar ingreso: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Error al guardar el ingreso'], 500);
        }
    }

    public function update(IngresoRequest $request, int $id): JsonResponse
    {
        try {
            $data        = $request->validated();
            $ingresoData = $data['ingreso']  ?? [];
            $paciente    = $data['paciente'] ?? [];
            $examenes    = $data['examenes'] ?? [
                'nuevos' => [],
                'existentes' => [],
                'eliminados' => [],
            ];

            // Forzar id en el ingresoData
            $ingresoData['id'] = $id;

            $result = $this->ingresoService->save($ingresoData, $paciente, $examenes);
            $ingresoModel = $result['ingreso'];
            $pacienteModel = $result['paciente'];

            $item = $this->ingresoService->getById($ingresoModel->id);

            return response()->json([
                'message' => 'Ingreso actualizado correctamente',
                'ingreso' => IngresoDto::fromEntityWithModel($item['entity'], $item['model']),
                'paciente' => $pacienteModel,
                'examenes' => [],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('Error al actualizar ingreso: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Error al actualizar el ingreso'], 500);
        }
    }

    /**
     * Eliminar (inactivar) un ingreso
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $ok = $this->ingresoService->inactivar($id);

            if (!$ok) {
                return response()->json(['message' => 'Ingreso no encontrado'], 404);
            }

            return response()->json(['message' => 'Ingreso eliminado correctamente']);
        } catch (\Throwable $e) {
            Log::error('Error al eliminar ingreso: ' . $e->getMessage());
            return response()->json(['message' => 'Error al eliminar el ingreso'], 500);
        }
    }

    /**
     * Exportar PDF del ingreso (Remisión)
     * GET /api/historias/ingresos/{id}/pdf
     */
    public function pdf(int $id, IngresoPdfService $service): Response
    {
        try {
            $dto = $service->buildIngresoDto($id);

            $user = request()->user('api')
                ?? auth('api')->user()
                ?? auth()->user();

            $nombreUsuario = trim(collect([
                $user?->primer_nombre ?? null,
                $user?->segundo_nombre ?? null,
                $user?->primer_apellido ?? null,
                $user?->segundo_apellido ?? null,
            ])->filter()->implode(' '));

            $dto['impreso_por']   = $nombreUsuario ?: ($user?->email ?? 'Usuario desconocido');
            $dto['impreso_fecha'] = now()->format('Y-m-d h:i A');
            $dto['enfasis_texto'] = $service->resolverTextoEnfasis($dto['ingreso']);

            $gruposPorProveedor = $service->groupExamenesByProveedor($dto);

            // Filtrar por proveedor_id si viene en la query (flujo normal desde el frontend)
            $proveedorId = request()->query('proveedor_id');
            if ($proveedorId !== null) {
                $gruposFiltrados = array_values(array_filter($gruposPorProveedor, function ($g) use ($proveedorId) {
                    $pid = $g['proveedor']?->id ?? null;
                    return (string) $pid === (string) $proveedorId;
                }));
                if (!empty($gruposFiltrados)) {
                    $gruposPorProveedor = $gruposFiltrados;
                }
            }

            $pac = $dto['paciente'] ?? null;

            $nombreCompleto = trim(collect([
                $pac?->primer_nombre ?? null,
                $pac?->segundo_nombre ?? null,
                $pac?->primer_apellido ?? null,
                $pac?->segundo_apellido ?? null,
            ])->filter()->implode(' '));

            $identificacion = $pac?->identificacion ?? 'sin_id';
            $nombreLimpio   = strtoupper(Str::slug($nombreCompleto, '_'));
            $idFormateado   = str_pad($id, 6, '0', STR_PAD_LEFT);

            // Siempre genera un PDF simple (un proveedor a la vez)
            $grupo      = $gruposPorProveedor[0];
            $proveedor  = $grupo['proveedor'];
            $dtoProveedor = $grupo['dto'];

            $proveedorSlug = $proveedor ? '_' . Str::slug($proveedor->nombre ?? '', '_') : '';
            $fileName = sprintf(
                'remision_%s_%s_%s%s.pdf',
                $idFormateado,
                $nombreLimpio,
                $identificacion,
                $proveedorSlug
            );

            return response()->streamDownload(function () use ($service, $dtoProveedor) {
                echo $service->renderPdf($dtoProveedor);
            }, $fileName, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Expose-Headers' => 'Content-Disposition, X-Filename',
                'X-Filename' => $fileName,
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"; filename*=UTF-8\'\'' . rawurlencode($fileName),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ingreso no encontrado'
            ], 404);
        } catch (\Throwable $e) {
            Log::warning('⚠️ Error al generar PDF de ingreso', [
                'ingreso_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener proveedores disponibles para el PDF del ingreso
     * GET /api/historias/ingresos/{id}/pdf-proveedores
     */
    public function pdfProveedores(int $id, IngresoPdfService $service): JsonResponse
    {
        try {
            $dto = $service->buildIngresoDto($id);
            $grupos = $service->groupExamenesByProveedor($dto);

            $proveedores = collect($grupos)->map(function ($grupo) {
                $proveedor = $grupo['proveedor'];
                return [
                    'id'     => $proveedor?->id ?? null,
                    'nombre' => $proveedor?->nombre ?? 'Sin proveedor',
                ];
            })->values()->all();

            return response()->json($proveedores);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Ingreso no encontrado'], 404);
        } catch (\Throwable $e) {
            Log::warning('⚠️ Error al obtener proveedores PDF', [
                'ingreso_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 📸 FOTO Y FIRMA DEL INGRESO
    // ==========================================

    /**
     * POST /api/historias/ingresos/{id}/foto
     */
    public function subirFoto(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'foto' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
            ]);

            $ingreso = IngresoModel::find($id);
            if (!$ingreso) {
                return response()->json(['message' => 'Ingreso no encontrado'], 404);
            }

            if ($ingreso->foto) {
                Storage::disk('public')->delete($ingreso->foto);
            }

            $file      = $request->file('foto');
            $extension = $file->getClientOriginalExtension();
            $path      = $file->storeAs("historias/ingresos/{$id}", "foto.{$extension}", 'public');

            $ingreso->foto = $path;
            $ingreso->save();

            // Sincronizar en la tabla de pacientes
            $paciente = PacienteModel::find($ingreso->paciente_id);
            if ($paciente) {
                $paciente->foto = $path;
                $paciente->save();
            }

            return response()->json([
                'message'  => 'Foto actualizada correctamente',
                'foto_url' => Storage::disk('public')->url($path),
                'foto'     => $path,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Archivo inválido', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            Log::error('Error al subir foto del ingreso: ' . $e->getMessage());
            return response()->json(['message' => 'Error al subir la foto'], 500);
        }
    }

    /**
     * POST /api/historias/ingresos/{id}/firma
     */
    public function subirFirma(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'firma' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
            ]);

            $ingreso = IngresoModel::find($id);
            if (!$ingreso) {
                return response()->json(['message' => 'Ingreso no encontrado'], 404);
            }

            if ($ingreso->firma) {
                Storage::disk('public')->delete($ingreso->firma);
            }

            $file      = $request->file('firma');
            $extension = $file->getClientOriginalExtension();
            $path      = $file->storeAs("historias/ingresos/{$id}", "firma.{$extension}", 'public');

            $ingreso->firma = $path;
            $ingreso->save();

            // Sincronizar en la tabla de pacientes
            $paciente = PacienteModel::find($ingreso->paciente_id);
            if ($paciente) {
                $paciente->firma = $path;
                $paciente->save();
            }

            return response()->json([
                'message'   => 'Firma actualizada correctamente',
                'firma_url' => Storage::disk('public')->url($path),
                'firma'     => $path,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Archivo inválido', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            Log::error('Error al subir firma del ingreso: ' . $e->getMessage());
            return response()->json(['message' => 'Error al subir la firma'], 500);
        }
    }

    // ==========================================
    // 📊 ESTADO HISTORIA CLÍNICA POR INGRESO
    // ==========================================

    /**
     * GET /api/historias/ingresos/historia-status?ids[]=1&ids[]=2
     * Devuelve qué secciones de historia clínica tienen registro para cada ingreso.
     */
    public function historiaStatus(Request $request): JsonResponse
    {
        $ids = $request->get('ids', []);
        if (empty($ids)) {
            return response()->json(['data' => (object) []]);
        }

        $ids = array_values(array_filter(array_map('intval', (array) $ids)));
        if (empty($ids)) {
            return response()->json(['data' => (object) []]);
        }

        $examenFisicoIds          = ExamenFisicoModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();
        $visiometriaIds           = VisiometriaModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();
        $audiometriaIds           = AudiometriaModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();
        $espirometriaIds          = EspirometriaModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();
        $optometriaIds            = OptometriaModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();
        $pruebaPsicosensometricaIds = PruebaPsicosensometricaModel::whereIn('ingreso_id', $ids)->pluck('ingreso_id')->toArray();

        $laboratorios = LaboratorioClinicoModel::whereIn('ingreso_id', $ids)
            ->where('estado', 1)
            ->get(['ingreso_id', 'examenes_resultados']);

        $radiografias = RadiografiaModel::whereIn('ingreso_id', $ids)
            ->where('estado', 1)
            ->get(['ingreso_id', 'examenes_resultados']);

        // Estado cerrado por sección desde secciones_estado (registro más reciente por ingreso+tipo_seccion)
        $seccionesLatest = DB::table('secciones_estado as s')
            ->whereIn('s.ingreso_id', $ids)
            ->whereRaw('s.id = (SELECT MAX(s2.id) FROM secciones_estado s2 WHERE s2.ingreso_id = s.ingreso_id AND s2.tipo_seccion = s.tipo_seccion)')
            ->select('s.ingreso_id', 's.tipo_seccion', 's.proceso', 's.estado')
            ->get();

        $seccionesMap = [];
        foreach ($seccionesLatest as $s) {
            $seccionesMap[$s->ingreso_id][$s->tipo_seccion] = [
                'proceso' => $s->proceso,
                'estado'  => $s->estado,
            ];
        }

        $data = [];
        foreach ($ids as $id) {
            $labExamenIds = [];
            $labRecord = $laboratorios->firstWhere('ingreso_id', $id);
            if ($labRecord && is_array($labRecord->examenes_resultados)) {
                $labExamenIds = array_values(array_filter(
                    array_column($labRecord->examenes_resultados, 'examen_id')
                ));
            }

            $radExamenIds = [];
            $radRecord = $radiografias->firstWhere('ingreso_id', $id);
            if ($radRecord && is_array($radRecord->examenes_resultados)) {
                $radExamenIds = array_values(array_filter(
                    array_column($radRecord->examenes_resultados, 'examen_id')
                ));
            }

            $cerrada = fn($tipo) => isset($seccionesMap[$id][$tipo]) && (
                ($seccionesMap[$id][$tipo]['proceso'] ?? '') === 'CERRAR' ||
                ($seccionesMap[$id][$tipo]['estado']  ?? 0)  == 9
            );

            $data[$id] = [
                'examen_fisico'          => in_array($id, $examenFisicoIds),
                'visiometria'            => in_array($id, $visiometriaIds),
                'audiometria'            => in_array($id, $audiometriaIds),
                'espirometria'           => in_array($id, $espirometriaIds),
                'optometria'             => in_array($id, $optometriaIds),
                'laboratorio_examen_ids' => $labExamenIds,
                'radiografia_examen_ids' => $radExamenIds,
                'historia_clinica_cerrada' => $cerrada('historia_clinica'),
                'audiometria_cerrada'    => $cerrada('audiometria'),
                'visiometria_cerrada'    => $cerrada('visiometria'),
                'espirometria_cerrada'   => $cerrada('espirometria'),
                'optometria_cerrada'             => $cerrada('optometria'),
                'laboratorio_cerrado'            => $cerrada('laboratorio_clinico'),
                'radiografia_cerrada'            => $cerrada('radiografia'),
                'prueba_psicosensometrica'       => in_array($id, $pruebaPsicosensometricaIds),
                'prueba_psicosensometrica_cerrada' => $cerrada('prueba_psicosensometrica'),
            ];
        }

        return response()->json(['data' => $data]);
    }

    // ==========================================
    // 📋 CATEGORÍAS DE EXAMEN
    // ==========================================

    /**
     * GET /api/historias/categoria-examen
     * Devuelve todas las categorías de examen activas.
     */
    public function indexCategoriasExamen(): JsonResponse
    {
        $categorias = CategoriaExamen::where('estado', 1)
            ->orderBy('codigo')
            ->get(['id', 'codigo', 'nbr_categoria_exa', 'estado']);

        return response()->json($categorias);
    }

    // ==========================================
    // 📁 CERTIFICADOS DEL INGRESO
    // ==========================================

    /**
     * POST /api/historias/ingresos/certificados
     * Sube uno o más certificados para un ingreso.
     * Estructura: historias/ingresos/{ingreso_id}/certificados/{paciente_id}/{examen_codigo}/{archivo}
     */
    public function storeSubirCertificado(IngresoCertificadoRequest $request): JsonResponse
    {
        $certificadosGuardados = [];

        try {
            $archivos = $request->validated()['archivos'];

            foreach ($archivos as $index => $archivoData) {
                /** @var \Illuminate\Http\UploadedFile $archivo */
                $archivo = $request->file("archivos.$index.archivo");

                $ingresoId  = $archivoData['ingreso_id'];
                $pacienteId = $archivoData['paciente_id'];
                $examenId   = $archivoData['examen_id'];

                if (!$archivo || !$ingresoId || !$pacienteId || !$examenId) {
                    continue;
                }

                $examen     = ExamenModel::find($examenId);
                $examenCode = $examen?->categoria_exam_id ?? $examenId;

                $nombreOriginal   = $archivo->getClientOriginalName();
                $nombreSanitizado = preg_replace('/[^A-Za-z0-9\-_\.]/', '_', $nombreOriginal);
                $nombre           = "certificado_{$examenId}_" . $nombreSanitizado;

                $rutaBase = "historias/ingresos/{$ingresoId}/certificados/{$pacienteId}/{$examenCode}";

                $path = $archivo->storeAs(
                    $rutaBase,
                    $nombre,
                    ['disk' => 'public', 'visibility' => 'public']
                );

                $archivoUrl = '/storage/' . $path;

                $entity = new IngresoCertificadoEntity(
                    id:         0,
                    ingreso_id: $ingresoId,
                    paciente_id: $pacienteId,
                    examen_id:  $examenId,
                    archivo:    $archivoUrl,
                    estado:     1,
                );

                $resultado = $this->ingresoCertificadoService->save($entity);

                $certificadosGuardados[] = [
                    'id'           => $resultado->id,
                    'ingreso_id'   => $resultado->ingreso_id,
                    'paciente_id'  => $resultado->paciente_id,
                    'examen_id'    => $resultado->examen_id,
                    'archivo'      => $resultado->archivo,
                    'nombre_examen' => $examen?->nbr_examen ?? '',
                    'codigo_examen' => $examen?->cdg_examen ?? '',
                ];
            }

            if (empty($certificadosGuardados)) {
                return response()->json([
                    'success' => true,
                    'message' => 'No hay nuevos archivos por guardar',
                    'data'    => [],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Certificados subidos correctamente',
                'data'    => $certificadosGuardados,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error al subir certificados de ingreso: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al subir certificados',
                'data'    => [],
            ], 500);
        }
    }

    /**
     * GET /api/historias/ingresos/certificados/{ingresoId}/{pacienteId}
     * Lista los certificados de un ingreso.
     */
    public function indexCertificados(int $ingresoId, int $pacienteId): JsonResponse
    {
        try {
            $certificados = $this->ingresoCertificadoService->getByIngresoAndPaciente($ingresoId, $pacienteId);

            $data = array_map(function ($cert) {
                $examen = ExamenModel::find($cert->examen_id);
                return [
                    'id'           => $cert->id,
                    'ingreso_id'   => $cert->ingreso_id,
                    'paciente_id'  => $cert->paciente_id,
                    'examen_id'    => $cert->examen_id,
                    'archivo'      => $cert->archivo,
                    'nombre_examen' => $examen?->nbr_examen ?? '',
                    'codigo_examen' => $examen?->cdg_examen ?? '',
                ];
            }, $certificados);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            Log::error('Error en indexCertificados: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al obtener certificados.'], 500);
        }
    }

    /**
     * PUT /api/historias/ingresos/{id}/modificar-fecha
     * Modifica la fecha de atención de un ingreso.
     */
    public function modificarFecha(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'fecha' => 'required|date',
            ]);

            $fecha = Carbon::parse($request->input('fecha'))->format('Y-m-d H:i:s');

            $item = $this->ingresoService->modificarFecha($id, $fecha);

            if (!$item) {
                return response()->json(['message' => 'Ingreso no encontrado'], 404);
            }

            return response()->json([
                'message' => 'Fecha de ingreso actualizada correctamente',
                'ingreso' => IngresoDto::fromEntityWithModel($item['entity'], $item['model']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error al modificar fecha de ingreso: ' . $e->getMessage());
            return response()->json(['message' => 'Error al modificar la fecha de ingreso'], 500);
        }
    }

    /**
     * DELETE /api/historias/ingresos/certificados/{id}
     * Elimina (inactiva + borra el archivo físico) un certificado.
     */
    public function destroyCertificado(int $id): JsonResponse
    {
        try {
            $eliminado = $this->ingresoCertificadoService->deleteById($id);

            if (!$eliminado) {
                return response()->json(['message' => 'El certificado no existe o ya fue eliminado.'], 404);
            }

            return response()->json(['message' => 'Certificado eliminado correctamente.'], 200);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        } catch (\Throwable $th) {
            Log::error('Error en destroyCertificado: ' . $th->getMessage(), ['id' => $id]);
            return response()->json(['message' => 'Error al eliminar el certificado.'], 500);
        }
    }
}
