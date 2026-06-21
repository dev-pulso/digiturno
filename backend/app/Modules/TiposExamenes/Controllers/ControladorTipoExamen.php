<?php

namespace App\Modules\TiposExamenes\Controllers;

use App\Models\TipoExamen;
use App\Modules\TiposExamenes\Requests\CrearTipoExamenRequest;
use App\Modules\TiposExamenes\Requests\ActualizarTipoExamenRequest;
use App\Modules\TiposExamenes\Resources\TipoExamenResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorTipoExamen extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tipos = TipoExamen::with('area')
            ->when($request->boolean('activo'), fn($q) => $q->activo())
            ->orderBy('nombre')
            ->get();

        return response()->json(TipoExamenResource::collection($tipos));
    }

    public function store(CrearTipoExamenRequest $request): JsonResponse
    {
        $tipo = TipoExamen::create($request->validated());
        $tipo->load('area');
        return response()->json(new TipoExamenResource($tipo), 201);
    }

    public function show(TipoExamen $tipoExamen): JsonResponse
    {
        $tipoExamen->load('area');
        return response()->json(new TipoExamenResource($tipoExamen));
    }

    public function update(ActualizarTipoExamenRequest $request, TipoExamen $tipoExamen): JsonResponse
    {
        $tipoExamen->update($request->validated());
        $tipoExamen->load('area');
        return response()->json(new TipoExamenResource($tipoExamen));
    }

    public function destroy(TipoExamen $tipoExamen): JsonResponse
    {
        $tipoExamen->update(['activo' => false]);
        return response()->json(['mensaje' => 'Tipo de examen desactivado']);
    }
}
