<?php

namespace App\Http\Middleware;

use App\Models\Area;
use App\Models\Turno;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireConsaludPermission
{
    public function handle(Request $request, Closure $next, string $permission, ?string $areaParameter = null): Response
    {
        $identity = $request->attributes->get('consalud.identity');
        if (!$identity || !in_array($permission, $identity['permissions'], true)) {
            return response()->json(['message' => 'No tienes permiso para esta operación'], 403);
        }

        if ($areaParameter) {
            $area = $request->route($areaParameter);
            $turno = $request->route('turno');
            if (!$area && $turno instanceof Turno) {
                $area = $turno->area;
            }
            // Collection routes are constrained in their controller; there is
            // no single route-bound area to validate here.
            if (!$area) {
                return $next($request);
            }
            $code = $area instanceof Area ? $area->codigo : Area::find($area)?->codigo;
            $allowed = $identity['area_codes'] ?? [];
            if (!$code || (!in_array('*', $allowed, true) && !in_array($code, $allowed, true))) {
                return response()->json(['message' => 'No tienes acceso a esta área'], 403);
            }
        }

        return $next($request);
    }
}
