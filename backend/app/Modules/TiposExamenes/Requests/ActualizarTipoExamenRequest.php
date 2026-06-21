<?php

namespace App\Modules\TiposExamenes\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarTipoExamenRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nombre' => 'sometimes|string|max:255',
            'codigo' => ['sometimes', 'string', 'max:10', Rule::unique('tipos_examenes', 'codigo')->ignore($this->route('tipoExamen'))],
            'area_id' => 'sometimes|exists:areas,id',
            'activo' => 'boolean',
        ];
    }
}
