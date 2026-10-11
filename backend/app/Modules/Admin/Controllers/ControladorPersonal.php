<?php

namespace App\Modules\Admin\Controllers;

use App\Models\PersonalDigiturno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ControladorPersonal extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PersonalDigiturno::with('areaPredeterminada');

        if ($request->has('q') && trim($request->q) !== '') {
            $busqueda = trim($request->q);
            $query->where(function ($q) use ($busqueda) {
                $q->where('numero_documento', 'ilike', "%{$busqueda}%")
                  ->orWhere('nombre', 'ilike', "%{$busqueda}%");
            });
        }

        if ($request->has('rol') && trim($request->rol) !== '') {
            $query->where('rol', $request->rol);
        }

        $personal = $query->orderBy('rol')
            ->orderBy('nombre')
            ->get();

        return response()->json($personal);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'numero_documento' => 'required|string|max:30|unique:personal_digiturno,numero_documento',
            'nombre' => 'nullable|string|max:255',
            'rol' => 'required|in:admin,recepcion,medico',
            'area_id_predeterminada' => 'nullable|exists:areas,id',
            'puede_rotar' => 'boolean',
            'activo' => 'boolean',
        ], [
            'numero_documento.required' => 'El número de documento es obligatorio.',
            'numero_documento.unique' => 'Este número de documento ya se encuentra registrado.',
            'rol.required' => 'El rol es obligatorio.',
            'rol.in' => 'El rol seleccionado no es válido.',
            'area_id_predeterminada.exists' => 'El consultorio seleccionado no existe.',
        ]);

        if ($validated['rol'] === 'medico' && empty($validated['area_id_predeterminada'])) {
            // Si es médico pero no especificó área, dejamos null o validamos según regla
        }

        $colaborador = PersonalDigiturno::create($validated);
        $colaborador->load('areaPredeterminada');

        return response()->json($colaborador, 201);
    }

    public function show(int $id): JsonResponse
    {
        $colaborador = PersonalDigiturno::with('areaPredeterminada')->findOrFail($id);
        return response()->json($colaborador);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $colaborador = PersonalDigiturno::findOrFail($id);

        $validated = $request->validate([
            'numero_documento' => 'sometimes|string|max:30|unique:personal_digiturno,numero_documento,' . $colaborador->id,
            'nombre' => 'nullable|string|max:255',
            'rol' => 'sometimes|in:admin,recepcion,medico',
            'area_id_predeterminada' => 'nullable|exists:areas,id',
            'puede_rotar' => 'boolean',
            'activo' => 'boolean',
        ]);

        $colaborador->update($validated);
        $colaborador->load('areaPredeterminada');

        return response()->json($colaborador);
    }

    public function toggleActivo(int $id): JsonResponse
    {
        $colaborador = PersonalDigiturno::findOrFail($id);
        $colaborador->activo = !$colaborador->activo;
        $colaborador->save();
        $colaborador->load('areaPredeterminada');

        return response()->json($colaborador);
    }

    public function destroy(int $id): JsonResponse
    {
        $colaborador = PersonalDigiturno::findOrFail($id);
        $colaborador->delete();

        return response()->json(['message' => 'Colaborador eliminado correctamente']);
    }
}
