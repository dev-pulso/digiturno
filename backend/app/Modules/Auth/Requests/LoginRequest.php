<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'usernameOrEmail' => 'required|string|max:100',
            'password' => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'usernameOrEmail.required' => 'El usuario o correo electrónico es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }
}
