<?php

namespace App\Modules\Auth\Controllers;

use App\Modules\Auth\Requests\LoginRequest;
use App\Services\ConsaludService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorAuth extends Controller
{
    public function __construct(
        private ConsaludService $consaludService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $credenciales = $request->validated();
        $resultado = $this->consaludService->login(
            $credenciales['usernameOrEmail'],
            $credenciales['password']
        );

        if (!$resultado) {
            $error = $this->consaludService->ultimoError() ?? 'Credenciales incorrectas';
            return response()->json([
                'message' => $error,
            ], 401);
        }

        $usuario = $resultado['user'] ?? null;
        if ($usuario && isset($usuario['estado']) && (int)$usuario['estado'] === 0) {
            return response()->json([
                'message' => 'El usuario se encuentra inactivo en Consalud.',
            ], 403);
        }

        // Consultar rol y asignación de consultorio en Digiturno
        $identificacion = $usuario['identificacion'] ?? $usuario['numero_documento'] ?? $usuario['documento'] ?? null;
        $personal = null;
        if ($identificacion) {
            $personal = \App\Models\PersonalDigiturno::with('areaPredeterminada')
                ->where('numero_documento', (string)$identificacion)
                ->where('activo', true)
                ->first();
        }

        if ($personal) {
            $usuario['rol'] = $personal->rol;
            $usuario['puede_rotar'] = (bool)$personal->puede_rotar;
            $usuario['area_predeterminada'] = $personal->areaPredeterminada ? [
                'id' => $personal->areaPredeterminada->id,
                'codigo' => $personal->areaPredeterminada->codigo,
                'nombre' => $personal->areaPredeterminada->nombre,
                'prefijo' => $personal->areaPredeterminada->prefijo,
            ] : null;
        } else {
            // Si la cédula es una de las admin iniciales o por defecto recepción
            $esAdmin = in_array((string)$identificacion, ['1065584737', '1065562800']);
            $usuario['rol'] = $esAdmin ? 'admin' : 'recepcion';
            $usuario['puede_rotar'] = true;
            $usuario['area_predeterminada'] = null;
        }

        $token = $resultado['access_token'];
        $expiresIn = (int)($resultado['expires_in'] ?? 3600);
        $minutosCookie = (int)ceil($expiresIn / 60);

        // Cookie HttpOnly segura contra XSS
        $cookie = cookie(
            'consalud_token',
            $token,
            $minutosCookie,
            '/',
            null,
            $request->isSecure(),
            true,  // httpOnly
            false,
            'lax'
        );

        return response()->json([
            'accessToken' => $token,
            'tokenType' => $resultado['token_type'] ?? 'Bearer',
            'expiresIn' => $expiresIn,
            'user' => $usuario,
        ])->withCookie($cookie);
    }

    public function me(Request $request): JsonResponse
    {
        $token = $request->cookie('consalud_token') ?? $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $perfil = $this->consaludService->me($token);
        if (!$perfil) {
            return response()->json(['message' => 'Sesión expirada o token inválido'], 401);
        }

        $identificacion = $perfil['identificacion'] ?? $perfil['numero_documento'] ?? $perfil['documento'] ?? null;
        $personal = null;
        if ($identificacion) {
            $personal = \App\Models\PersonalDigiturno::with('areaPredeterminada')
                ->where('numero_documento', (string)$identificacion)
                ->where('activo', true)
                ->first();
        }

        if ($personal) {
            $perfil['rol'] = $personal->rol;
            $perfil['puede_rotar'] = (bool)$personal->puede_rotar;
            $perfil['area_predeterminada'] = $personal->areaPredeterminada ? [
                'id' => $personal->areaPredeterminada->id,
                'codigo' => $personal->areaPredeterminada->codigo,
                'nombre' => $personal->areaPredeterminada->nombre,
                'prefijo' => $personal->areaPredeterminada->prefijo,
            ] : null;
        } else {
            $esAdmin = in_array((string)$identificacion, ['1065584737', '1065562800']);
            $perfil['rol'] = $esAdmin ? 'admin' : 'recepcion';
            $perfil['puede_rotar'] = true;
            $perfil['area_predeterminada'] = null;
        }

        return response()->json($perfil);
    }

    public function logout(): JsonResponse
    {
        $cookie = cookie()->forget('consalud_token');
        return response()->json(['message' => 'Sesión cerrada exitosamente'])->withCookie($cookie);
    }
}
