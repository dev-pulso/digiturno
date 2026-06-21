<?php

namespace App\Modules\Areas\Controllers;

use App\Models\Area;
use App\Modules\Areas\Requests\CrearAreaRequest;
use App\Modules\Areas\Requests\ActualizarAreaRequest;
use App\Modules\Areas\Resources\AreaResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorArea extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $areas = Area::with(['turnos' => fn($q) => $q->select('id', 'area_id', 'estado', 'numero_turno', 'nombre_paciente')])
            ->with('turnoActual')
            ->when(!$request->boolean('todo'), fn($q) => $q->activo())
            ->orderBy('id')
            ->get();

        return response()->json(AreaResource::collection($areas));
    }

    public function store(CrearAreaRequest $request): JsonResponse
    {
        $area = Area::create($request->validated());
        return response()->json(new AreaResource($area), 201);
    }

    public function show(Area $area): JsonResponse
    {
        $area->loadCount(['turnos as turnos_espera' => fn($q) => $q->where('estado', 'en_espera')]);
        return response()->json(new AreaResource($area));
    }

    public function update(ActualizarAreaRequest $request, Area $area): JsonResponse
    {
        $area->update($request->validated());
        return response()->json(new AreaResource($area));
    }

    public function destroy(Area $area): JsonResponse
    {
        $area->update(['activo' => false]);
        return response()->json(['mensaje' => 'Área desactivada']);
    }
}
