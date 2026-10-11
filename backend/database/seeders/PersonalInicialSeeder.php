<?php

namespace Database\Seeders;

use App\Models\PersonalDigiturno;
use Illuminate\Database\Seeder;

class PersonalInicialSeeder extends Seeder
{
    public function run(): void
    {
        $admins = [
            [
                'numero_documento' => '1065584737',
                'nombre' => 'Administrador 1',
                'rol' => 'admin',
                'puede_rotar' => true,
                'activo' => true,
            ],
            [
                'numero_documento' => '1065562800',
                'nombre' => 'Administrador 2',
                'rol' => 'admin',
                'puede_rotar' => true,
                'activo' => true,
            ],
        ];

        foreach ($admins as $adminData) {
            PersonalDigiturno::updateOrCreate(
                ['numero_documento' => $adminData['numero_documento']],
                $adminData
            );
        }
    }
}
