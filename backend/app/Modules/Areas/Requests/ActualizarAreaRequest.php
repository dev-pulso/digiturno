<?php

namespace App\Modules\Areas\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarAreaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'codigo' => ['sometimes', 'string', 'max:10', Rule::unique('areas', 'codigo')->ignore($this->route('area'))],
            'nombre' => 'sometimes|string|max:255',
            'prefijo' => 'sometimes|string|max:10',
            'color' => 'sometimes|string|max:20',
            'activo' => 'boolean',
        ];
    }
}
