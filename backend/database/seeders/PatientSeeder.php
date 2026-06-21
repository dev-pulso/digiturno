<?php

namespace Database\Seeders;

use App\Models\Patient;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            ['document_type' => 'CC', 'document_number' => '12345678', 'full_name' => 'María Rodríguez', 'phone' => '3001234567'],
            ['document_type' => 'CC', 'document_number' => '23456789', 'full_name' => 'Juan Carlos Pérez', 'phone' => '3012345678'],
            ['document_type' => 'CC', 'document_number' => '34567890', 'full_name' => 'Ana María López', 'phone' => '3023456789'],
            ['document_type' => 'CC', 'document_number' => '45678901', 'full_name' => 'Carlos Martínez', 'phone' => '3034567890'],
            ['document_type' => 'CC', 'document_number' => '56789012', 'full_name' => 'Sofía Gómez', 'phone' => '3045678901'],
            ['document_type' => 'CC', 'document_number' => '67890123', 'full_name' => 'Luis Alberto Ruiz', 'phone' => '3056789012'],
            ['document_type' => 'CC', 'document_number' => '78901234', 'full_name' => 'Carmen Torres', 'phone' => '3067890123'],
            ['document_type' => 'CC', 'document_number' => '89012345', 'full_name' => 'Andrés Vargas', 'phone' => '3078901234'],
            ['document_type' => 'CC', 'document_number' => '90123456', 'full_name' => 'Patricia Herrera', 'phone' => '3089012345'],
            ['document_type' => 'CC', 'document_number' => '01234567', 'full_name' => 'Roberto Silva', 'phone' => '3090123456'],
            ['document_type' => 'CC', 'document_number' => '11223344', 'full_name' => 'Diana Castro', 'phone' => '3101122334'],
            ['document_type' => 'CC', 'document_number' => '22334455', 'full_name' => 'Miguel Ángel Reyes', 'phone' => '3112233445'],
            ['document_type' => 'CC', 'document_number' => '33445566', 'full_name' => 'Laura Jiménez', 'phone' => '3123344556'],
            ['document_type' => 'CC', 'document_number' => '44556677', 'full_name' => 'Fernando Ortiz', 'phone' => '3134455667'],
            ['document_type' => 'CC', 'document_number' => '55667788', 'full_name' => 'Gabriela Mendoza', 'phone' => '3145566778'],
            ['document_type' => 'CC', 'document_number' => '66778899', 'full_name' => 'Ricardo Navarro', 'phone' => '3156677889'],
            ['document_type' => 'CC', 'document_number' => '77889900', 'full_name' => 'Valentina Ríos', 'phone' => '3167788990'],
            ['document_type' => 'CC', 'document_number' => '88990011', 'full_name' => 'Javier Delgado', 'phone' => '3178899001'],
            ['document_type' => 'CC', 'document_number' => '99001122', 'full_name' => 'Isabel Aguilar', 'phone' => '3189900112'],
            ['document_type' => 'CC', 'document_number' => '10020033', 'full_name' => 'Pedro Castillo', 'phone' => '3191002003'],
        ];

        foreach ($patients as $data) {
            Patient::create($data);
        }
    }
}
