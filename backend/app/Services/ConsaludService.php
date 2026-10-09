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

    /** Último error de red/auth para mensajes al cliente (no se cachea). */
    private ?string $ultimoError = null;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('API_URL_CONSALUD', ''), '/');
        $this->user = env('CONSALUD_API_USER', '');
        $this->password = env('CONSALUD_API_PASSWORD', '');
    }

    public function ultimoError(): ?string
    {
        return $this->ultimoError;
    }

    public function buscarPacientes(string $busqueda): array
    {
        $this->ultimoError = null;
        $token = $this->obtenerToken();
        if (!$token) {
            $this->ultimoError = $this->ultimoError ?? 'No se pudo autenticar con Consalud';
            Log::warning('ConsaludService: no se pudo obtener token');
            return [];
        }

        try {
            $response = $this->http()
                ->withToken($token)
                ->timeout(30)
                ->get($this->baseUrl . '/historias/ingresos/gestion', [
                    'busqueda' => $busqueda,
                ]);

            if (!$response->successful()) {
                $this->ultimoError = 'Consalud respondió con error (HTTP ' . $response->status() . ')';
                Log::warning('ConsaludService: respuesta no exitosa', [
                    'status' => $response->status(),
                    'busqueda' => $busqueda,
                ]);
                return [];
            }

            $data = $this->jsonBody($response);
            return is_array($data) ? $data : [];
        } catch (\Exception $e) {
            $this->ultimoError = 'Consalud no disponible: ' . $e->getMessage();
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
            'fuente' => 'consalud',
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
            $response = $this->http()
                ->withToken($token)
                ->timeout(30)
                ->get($this->baseUrl . '/historias/ingresos/historia-status', [
                    'ids' => $ingresoIds,
                ]);

            if (!$response->successful()) {
                return [];
            }

            return $this->jsonBody($response)['data'] ?? [];
        } catch (\Exception $e) {
            Log::warning('ConsaludService: error en historiaStatus: ' . $e->getMessage());
            return [];
        }
    }

    /** Quita BOM UTF-8 y decodifica JSON de respuestas Consalud. */
    private function jsonBody(\Illuminate\Http\Client\Response $response): array
    {
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', $response->body()) ?? '';
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
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

    // ponytail: env devuelve string; filter_var convierte "false" bien
    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::acceptJson();
        $verifySsl = filter_var(env('CONSALUD_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN);
        if (!$verifySsl) {
            $request = $request->withoutVerifying();
        }
        return $request;
    }

    private function obtenerToken(): ?string
    {
        $cacheKey = 'consalud_api_token';

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        try {
            $response = $this->http()
                ->timeout(15)
                ->post($this->baseUrl . '/auth/login', [
                    'usernameOrEmail' => $this->user,
                    'password' => $this->password,
                ]);

            if ($response->successful()) {
                // Consalud a veces manda BOM UTF-8; json() de Laravel falla con eso
                $token = $this->jsonBody($response)['access_token'] ?? null;
                if (is_string($token) && $token !== '') {
                    Cache::put($cacheKey, $token, 3600);
                    return $token;
                }
            }

            $this->ultimoError = 'Login Consalud fallido (HTTP ' . $response->status() . ')';
            Log::warning('ConsaludService: login fallido', [
                'status' => $response->status(),
                'body_preview' => substr($response->body(), 0, 120),
            ]);
            return null;
        } catch (\Exception $e) {
            $this->ultimoError = 'Consalud no disponible: ' . $e->getMessage();
            Log::warning('ConsaludService: error en login: ' . $e->getMessage());
            return null;
        }
    }
}
