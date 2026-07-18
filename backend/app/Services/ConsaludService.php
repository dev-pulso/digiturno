<?php

namespace App\Services;

use App\Models\Paciente;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConsaludService
{
    private string $baseUrl;
    private string $user;
    private string $password;

    public function __construct()
    {
        $this->baseUrl = config('services.consalud.url');
        $this->user = (string) config('services.consalud.api_user');
        $this->password = (string) config('services.consalud.api_password');
    }

    public function buscarPacientes(string $busqueda): array
    {
        $token = $this->obtenerToken();
        if (!$token) {
            Log::warning('ConsaludService: no se pudo obtener token');
            return [];
        }

        try {
            $response = Http::withToken($token)
                ->timeout(30)
                ->get($this->baseUrl . '/historias/ingresos/gestion', [
                    'busqueda' => $busqueda,
                ]);

            if (!$response->successful()) {
                Log::warning('ConsaludService: respuesta no exitosa', [
                    'status' => $response->status(),
                    'busqueda' => $busqueda,
                ]);
                return [];
            }

            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::warning('ConsaludService: error al buscar pacientes: ' . $e->getMessage());
            return [];
        }
    }

    public function buscarPacientePorDocumento(string $documento): ?Paciente
    {
        $resultados = $this->buscarPacientes($documento);
        if (empty($resultados)) {
            return null;
        }

        $ingreso = $resultados[0];
        $pacienteData = $ingreso['paciente'] ?? null;
        if (!$pacienteData) {
            return null;
        }

        return $this->sincronizarPaciente($pacienteData);
    }

    public function buscarIngresoCompleto(string $documento): ?array
    {
        $resultados = $this->buscarPacientes($documento);
        if (empty($resultados)) {
            return null;
        }

        $ingreso = $resultados[0];
        $pacienteData = $ingreso['paciente'] ?? null;
        if (!$pacienteData) {
            return null;
        }

        $paciente = $this->sincronizarPaciente($pacienteData);

        $historiaStatus = $this->historiaStatus([$ingreso['id']]);

        return [
            'paciente' => $paciente,
            'ingreso' => $ingreso,
            'historia_status' => $historiaStatus[$ingreso['id']] ?? null,
        ];
    }

    public function historiaStatus(array $ingresoIds): array
    {
        if (empty($ingresoIds)) {
            return [];
        }

        $token = $this->obtenerToken();
        if (!$token) {
            return [];
        }

        try {
            $response = Http::withToken($token)
                ->timeout(30)
                ->get($this->baseUrl . '/historias/ingresos/historia-status', [
                    'ids' => $ingresoIds,
                ]);

            if (!$response->successful()) {
                return [];
            }

            return $response->json('data') ?? [];
        } catch (\Exception $e) {
            Log::warning('ConsaludService: error en historiaStatus: ' . $e->getMessage());
            return [];
        }
    }

    private function sincronizarPaciente(array $data): Paciente
    {
        $identificacion = $data['identificacion'] ?? '';
        $tipoDoc = $data['tipo_identificacion']['sigla'] ?? 'CC';
        $nombreCompleto = trim(implode(' ', array_filter([
            $data['primer_nombre'] ?? '',
            $data['segundo_nombre'] ?? '',
            $data['primer_apellido'] ?? '',
            $data['segundo_apellido'] ?? '',
        ])));
        $telefono = $data['celular'] ?? '';
        $correo = $data['email'] ?? '';
        $fechaNacimiento = $data['fecha_nacimiento'] ?? null;
        $genero = $data['genero']['nombre'] ?? null;

        $metadatos = [
            'consalud_paciente_id' => $data['id'] ?? null,
            'fecha_nacimiento' => $fechaNacimiento,
            'genero' => $genero,
        ];

        $paciente = Paciente::where('numero_documento', $identificacion)->first();

        if ($paciente) {
            $paciente->update([
                'nombre_completo' => $nombreCompleto,
                'tipo_documento' => $tipoDoc,
                'telefono' => $telefono,
                'correo' => $correo,
                'metadatos' => $metadatos,
            ]);
        } else {
            $paciente = Paciente::create([
                'numero_documento' => $identificacion,
                'tipo_documento' => $tipoDoc,
                'nombre_completo' => $nombreCompleto,
                'telefono' => $telefono,
                'correo' => $correo,
                'metadatos' => $metadatos,
            ]);
        }

        return $paciente;
    }

    private function obtenerToken(): ?string
    {
        $cacheKey = 'consalud_api_token';

        return Cache::remember($cacheKey, 3600, function () {
            try {
                $response = Http::acceptJson()
                    ->timeout(15)
                    ->post($this->baseUrl . '/auth/login', [
                        'usernameOrEmail' => $this->user,
                        'password' => $this->password,
                    ]);

                if ($response->successful()) {
                    return $response->json('access_token');
                }

                Log::warning('ConsaludService: login fallido', [
                    'status' => $response->status(),
                ]);
                return null;
            } catch (\Exception $e) {
                Log::warning('ConsaludService: error en login: ' . $e->getMessage());
                return null;
            }
        });
    }
}
