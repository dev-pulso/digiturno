<?php

namespace App\Modules\Areas\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearAreaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'codigo' => 'required|string|max:10|unique:areas,codigo',
            'nombre' => 'required|string|max:255',
            'prefijo' => 'required|string|max:10',
            'color' => 'required|string|max:20',
            'activo' => 'boolean',
        ];
    }
}
