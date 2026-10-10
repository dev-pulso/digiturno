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

        return response()->json($perfil);
    }

    public function logout(): JsonResponse
    {
        $cookie = cookie()->forget('consalud_token');
        return response()->json(['message' => 'Sesión cerrada exitosamente'])->withCookie($cookie);
    }
}
