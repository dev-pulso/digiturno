<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarRolDigiturno
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->attributes->get('auth_user');

        if (!$usuario || !isset($usuario['rol'])) {
            return response()->json([
                'message' => 'No autenticado o sin rol asignado.',
            ], 401);
        }

        $rolesPermitidos = [];
        foreach ($roles as $r) {
            foreach (explode(',', $r) as $subRole) {
                $trimmed = trim($subRole);
                if ($trimmed !== '') {
                    $rolesPermitidos[] = $trimmed;
                }
            }
        }

        if (!in_array($usuario['rol'], $rolesPermitidos, true)) {
            return response()->json([
                'message' => 'No tienes permisos suficientes para realizar esta acción.',
                'rol_actual' => $usuario['rol'],
                'roles_requeridos' => $rolesPermitidos,
            ], 403);
        }

        return $next($request);
    }
}
