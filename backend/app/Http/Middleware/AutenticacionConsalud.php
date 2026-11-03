<?php

namespace App\Http\Middleware;

use App\Models\PersonalDigiturno;
use App\Services\ConsaludService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AutenticacionConsalud
{
    public function __construct(
        private ConsaludService $consaludService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('consalud_token') ?? $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'No autenticado. Token de acceso requerido.',
            ], 401);
        }

        $cacheKey = 'consalud_me_' . hash('sha256', $token);

        $usuario = Cache::remember($cacheKey, 300, function () use ($token) {
            $perfil = $this->consaludService->me($token);
            if (!$perfil) {
                return null;
            }

            if (isset($perfil['estado']) && (int)$perfil['estado'] === 0) {
                return false;
            }

            $identificacion = $perfil['identificacion'] ?? $perfil['numero_documento'] ?? $perfil['documento'] ?? null;
            $personal = null;
            if ($identificacion) {
                $personal = PersonalDigiturno::with('areaPredeterminada')
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
                $perfil['personal_digiturno_id'] = $personal->id;
            } else {
                $adminCedulas = config('services.digiturno.admin_cedulas', ['1065584737', '1065562800']);
                $esAdmin = in_array((string)$identificacion, $adminCedulas);
                $perfil['rol'] = $esAdmin ? 'admin' : 'recepcion';
                $perfil['puede_rotar'] = true;
                $perfil['area_predeterminada'] = null;
                $perfil['personal_digiturno_id'] = null;
            }

            return $perfil;
        });

        if ($usuario === false) {
            return response()->json([
                'message' => 'El usuario se encuentra inactivo.',
            ], 403);
        }

        if (!$usuario) {
            return response()->json([
                'message' => 'Sesión expirada o token inválido.',
            ], 401);
        }

        $request->attributes->set('auth_user', $usuario);

        return $next($request);
    }
}
