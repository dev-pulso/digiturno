<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Ventanilla;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            ['code' => 'mg', 'name' => 'Medicina General', 'prefix' => 'MG', 'color' => '#2563eb', 'ventanillas_count' => 3],
            ['code' => 'es', 'name' => 'Especialidades', 'prefix' => 'ES', 'color' => '#7c3aed', 'ventanillas_count' => 4],
            ['code' => 'lab', 'name' => 'Laboratorio', 'prefix' => 'LAB', 'color' => '#16a34a', 'ventanillas_count' => 2],
            ['code' => 'img', 'name' => 'Imágenes', 'prefix' => 'IMG', 'color' => '#0891b2', 'ventanillas_count' => 2],
            ['code' => 'caja', 'name' => 'Caja', 'prefix' => 'CAJA', 'color' => '#ea580c', 'ventanillas_count' => 3],
            ['code' => 'farm', 'name' => 'Farmacia', 'prefix' => 'FARM', 'color' => '#db2777', 'ventanillas_count' => 2],
            ['code' => 'adm', 'name' => 'Admisión', 'prefix' => 'ADM', 'color' => '#475569', 'ventanillas_count' => 2],
        ];

        foreach ($areas as $data) {
            $area = Area::create($data);
            for ($i = 1; $i <= $area->ventanillas_count; $i++) {
                Ventanilla::create([
                    'area_id' => $area->id,
                    'number' => $i,
                    'name' => "Ventanilla {$i}",
                ]);
            }
        }
    }
}
