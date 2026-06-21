<?php

namespace App\Modules\Patients\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearPacienteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'tipo_documento' => 'required|string|max:10',
            'numero_documento' => 'required|string|max:30',
            'nombre_completo' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:255',
        ];
    }
}
