<?php

namespace App\Http\Controllers\Auth;

use App\Application\Services\User\AuthService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    private $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'usernameOrEmail' => 'required|string',
            'password' => 'required|string',
        ], [
            'usernameOrEmail.required' => 'El campo usuario o correo es obligatorio.',
            'usernameOrEmail.string'   => 'El campo usuario o correo debe ser texto.',
            'password.required'        => 'La contraseña es obligatoria.',
            'password.string'          => 'La contraseña debe ser texto.',
        ]);

        $response = $this->authService->login(
            $request->usernameOrEmail,
            $request->password
        );

        // Si $response es null, las credenciales son inválidas
        if (!$response) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario/Correo o contraseña incorrectos. Por favor, inténtelo de nuevo.'
            ], 401);
        }

        // Verifica si la respuesta es un error (código de estado >= 400)
        if ($response->getStatusCode() >= 400) {
            $errorData = $response->getData(true); // Obtiene los datos del error como array
            $message = $errorData['error'] ?? 'Error desconocido al procesar la solicitud.';

            return response()->json([
                'success' => false,
                'message' => $message
            ], $response->getStatusCode());
        }

        return $response;
    }

    public function me(): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        return response()->json($user);
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();
        return response()->json(['message' => 'Cerró sesión exitosamente']);
    }
}
