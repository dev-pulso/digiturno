<?php

namespace App\Modules\Consalud\Controllers;

use App\Models\ConsaludCategoriaArea;
use App\Models\TipoExamen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class ControladorConsaludCategorias extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = ConsaludCategoriaArea::with(['area', 'tipoExamen'])
            ->orderBy('categoria_exam_id')
            ->get();

        return response()->json($categorias);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categoria_exam_id' => 'required|integer|unique:consalud_categorias_areas,categoria_exam_id',
            'area_id' => 'required|exists:areas,id',
            'nombre' => 'required|string|max:150',
        ]);

        $tipo = TipoExamen::where('nombre', $validated['nombre'])
            ->where('area_id', $validated['area_id'])
            ->first();

        if (!$tipo) {
            $base = Str::upper(Str::substr(Str::slug($validated['nombre'], ''), 0, 3));
            $codigo = $base;
            $contador = 0;
            while (TipoExamen::where('codigo', $codigo)->exists()) {
                $contador++;
                $codigo = Str::substr($base, 0, 3 - strlen((string) $contador)) . $contador;
            }

            $tipo = TipoExamen::create([
                'nombre' => $validated['nombre'],
                'codigo' => $codigo,
                'area_id' => $validated['area_id'],
                'activo' => true,
            ]);
        }

        $mapping = ConsaludCategoriaArea::create([
            'categoria_exam_id' => $validated['categoria_exam_id'],
            'area_id' => $validated['area_id'],
            'tipo_examen_id' => $tipo->id,
            'nombre' => $validated['nombre'],
        ]);

        return response()->json($mapping->load(['area', 'tipoExamen']), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $mapping = ConsaludCategoriaArea::findOrFail($id);

        $validated = $request->validate([
            'categoria_exam_id' => 'sometimes|required|integer|unique:consalud_categorias_areas,categoria_exam_id,' . $mapping->id,
            'area_id' => 'required|exists:areas,id',
            'nombre' => 'sometimes|required|string|max:150',
        ]);

        $mapping->fill($validated);
        $mapping->save();

        if ($mapping->tipo_examen_id) {
            $tipo = TipoExamen::find($mapping->tipo_examen_id);
            if ($tipo) {
                $tipo->update([
                    'area_id' => $mapping->area_id,
                    'nombre' => $mapping->nombre,
                ]);
            }
        } else {
            $tipo = TipoExamen::where('nombre', $mapping->nombre)
                ->where('area_id', $mapping->area_id)
                ->first();

            if (!$tipo) {
                $base = Str::upper(Str::substr(Str::slug($mapping->nombre, ''), 0, 3));
                $codigo = $base;
                $contador = 0;
                while (TipoExamen::where('codigo', $codigo)->exists()) {
                    $contador++;
                    $codigo = Str::substr($base, 0, 3 - strlen((string) $contador)) . $contador;
                }

                $tipo = TipoExamen::create([
                    'nombre' => $mapping->nombre,
                    'codigo' => $codigo,
                    'area_id' => $mapping->area_id,
                    'activo' => true,
                ]);
            }
            $mapping->update(['tipo_examen_id' => $tipo->id]);
        }

        return response()->json($mapping->load(['area', 'tipoExamen']));
    }
}
