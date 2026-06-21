<?php

namespace App\Modules\TiposExamenes\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearTipoExamenRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:10|unique:tipos_examenes,codigo',
            'area_id' => 'required|exists:areas,id',
            'activo' => 'boolean',
        ];
    }
}
