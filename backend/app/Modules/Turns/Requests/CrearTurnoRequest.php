<?php

namespace App\Modules\Turns\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearTurnoRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'area_id' => 'required|exists:areas,id',
            'paciente_id' => 'nullable|exists:pacientes,id',
            'examen_paciente_id' => 'nullable|exists:examenes_pacientes,id',
            'nombre_paciente' => 'required|string|max:50',
            'origen' => 'nullable|string|in:recepcion,kiosco',
        ];
    }
}
