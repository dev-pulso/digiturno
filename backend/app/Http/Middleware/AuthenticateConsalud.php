<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateConsalud
{
    /**
     * Validates the opaque Consalud access token. Development fixtures travel
     * through the exact same Bearer-token path, but are impossible in prod.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Autenticación requerida'], 401);
        }

        $identity = $this->resolveIdentity($token);
        if (!$identity) {
            return response()->json(['message' => 'La sesión de Consalud no es válida'], 401);
        }

        $request->attributes->set('consalud.identity', $identity);

        return $next($request);
    }

    private function resolveIdentity(string $token): ?array
    {
        if (config('services.consalud.identity_provider') === 'mock') {
            return $this->mockIdentity($token);
        }

        $baseUrl = config('services.consalud.url');
        if (!$baseUrl) {
            return null;
        }

        $key = 'consalud:identity:'.hash('sha256', $token);

        try {
            return Cache::remember($key, config('services.consalud.identity_cache_seconds'), function () use ($baseUrl, $token) {
                $response = Http::acceptJson()
                    ->withToken($token)
                    ->connectTimeout(config('services.consalud.connect_timeout'))
                    ->timeout(config('services.consalud.timeout'))
                    ->get($baseUrl.'/auth/me');

                if (!$response->successful()) {
                    return null;
                }

                return $this->normaliseIdentity($response->json());
            });
        } catch (\Throwable) {
            // Identity-provider outages must fail closed, never become a 500.
            return null;
        }
    }

    private function mockIdentity(string $token): ?array
    {
        if (!app()->environment(['local', 'testing'])) {
            return null;
        }

        return config('consalud.mock_identities.'.$token);
    }

    private function normaliseIdentity(array $payload): ?array
    {
        $user = $payload['user'] ?? $payload;
        $id = $user['id'] ?? null;
        if (!$id) {
            return null;
        }

        return [
            'id' => (string) $id,
            'name' => $user['full_name'] ?? $user['nombre_completo'] ?? $user['nombre'] ?? $user['usuario'] ?? 'Usuario Consalud',
            'permissions' => array_values($payload['permissions'] ?? $user['permissions'] ?? []),
            'area_codes' => array_values($payload['digiturno_area_codes'] ?? $user['digiturno_area_codes'] ?? []),
        ];
    }
}
