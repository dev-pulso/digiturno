<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\ConsaludCategoriaArea;
use App\Models\TipoExamen;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ConsaludCategoriasAreasSeeder extends Seeder
{
    public function run(): void
    {
        $c4 = Area::where('codigo', 'c4')->first();
        $tm = Area::where('codigo', 'tm')->first();
        $c2 = Area::where('codigo', 'c2')->first();
        $c3 = Area::where('codigo', 'c3')->first();
        $c1 = Area::where('codigo', 'c1')->first();

        $mapping = [
            ['categoria_exam_id' => 1,  'area' => $c1, 'nombre' => 'Evaluación médica ocupacional'],
            ['categoria_exam_id' => 2,  'area' => $tm, 'nombre' => 'Laboratorio'],
            ['categoria_exam_id' => 3,  'area' => $c2, 'nombre' => 'Visiometría'],
            ['categoria_exam_id' => 4,  'area' => $c3, 'nombre' => 'Audiometría'],
            ['categoria_exam_id' => 5,  'area' => $c1, 'nombre' => 'Espirometría'],
            ['categoria_exam_id' => 6,  'area' => $c1, 'nombre' => 'Electrocardiograma'],
            ['categoria_exam_id' => 7,  'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 8,  'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 9,  'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 10, 'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 11, 'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 12, 'area' => $tm, 'nombre' => 'Radiografía'],
            ['categoria_exam_id' => 13, 'area' => $c4, 'nombre' => 'Psicosensométrica'],
            ['categoria_exam_id' => 15, 'area' => $c2, 'nombre' => 'Optometría'],
        ];

        foreach ($mapping as $item) {
            $area = $item['area'];
            $nombre = $item['nombre'];

            if (!$area) continue;

            $tipoExamen = TipoExamen::firstOrCreate(
                ['nombre' => $nombre, 'area_id' => $area->id],
                ['codigo' => $this->generarCodigo($nombre), 'activo' => true],
            );

            ConsaludCategoriaArea::updateOrCreate(
                ['categoria_exam_id' => $item['categoria_exam_id']],
                [
                    'area_id' => $area->id,
                    'nombre' => $nombre,
                    'tipo_examen_id' => $tipoExamen->id,
                ]
            );
        }
    }

    private function generarCodigo(string $nombre): string
    {
        $base = Str::upper(Str::substr(Str::slug($nombre, ''), 0, 3));
        $codigo = $base;

        $contador = 0;
        while (TipoExamen::where('codigo', $codigo)->exists()) {
            $contador++;
            $codigo = Str::substr($base, 0, 3 - strlen((string) $contador)) . $contador;
        }
        return $codigo;
    }
}
