<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\TipoExamen;
use App\Models\Paciente;
use App\Models\ExamenPaciente;
use App\Enums\EstadoExamenPaciente;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            ['codigo' => 'c1', 'nombre' => 'Consultorio 1', 'prefijo' => 'C1', 'color' => '#2563eb'],
            ['codigo' => 'c2', 'nombre' => 'Consultorio 2', 'prefijo' => 'C2', 'color' => '#059669'],
            ['codigo' => 'c3', 'nombre' => 'Consultorio 3', 'prefijo' => 'C3', 'color' => '#d97706'],
            ['codigo' => 'c4', 'nombre' => 'Consultorio 4', 'prefijo' => 'C4', 'color' => '#dc2626'],
            ['codigo' => 'tm', 'nombre' => 'Toma de Muestras', 'prefijo' => 'TM', 'color' => '#7c3aed'],
        ];

        foreach ($areas as $areaData) {
            Area::create($areaData);
        }

        $c1 = Area::where('codigo', 'c1')->first();
        $c2 = Area::where('codigo', 'c2')->first();
        $c3 = Area::where('codigo', 'c3')->first();
        $c4 = Area::where('codigo', 'c4')->first();
        $tm = Area::where('codigo', 'tm')->first();

        $tiposExamenes = [
            ['nombre' => 'Espirometría', 'codigo' => 'ESP', 'area_id' => $c1->id],
            ['nombre' => 'Oftalmología', 'codigo' => 'OFT', 'area_id' => $c2->id],
            ['nombre' => 'Audiometría', 'codigo' => 'AUD', 'area_id' => $c3->id],
            ['nombre' => 'Electrocardiograma', 'codigo' => 'ECG', 'area_id' => $c4->id],
            ['nombre' => 'Examen de Sangre', 'codigo' => 'SNG', 'area_id' => $tm->id],
            ['nombre' => 'Optometría', 'codigo' => 'OPT', 'area_id' => $c2->id],
            ['nombre' => 'Toma de Presión', 'codigo' => 'PRE', 'area_id' => $c1->id],
        ];

        foreach ($tiposExamenes as $tipo) {
            TipoExamen::create($tipo);
        }

        $pacientesData = [
            ['tipo_documento' => 'CC', 'numero_documento' => '123456789', 'nombre_completo' => 'Juan García Pérez', 'telefono' => '3001234567', 'examenes' => ['ESP', 'OFT']],
            ['tipo_documento' => 'CC', 'numero_documento' => '987654321', 'nombre_completo' => 'María López Ramírez', 'telefono' => '3007654321', 'examenes' => ['AUD', 'ECG', 'SNG']],
            ['tipo_documento' => 'CC', 'numero_documento' => '456789123', 'nombre_completo' => 'Carlos Martínez Díaz', 'telefono' => '3009876543', 'examenes' => ['ESP', 'PRE', 'SNG']],
            ['tipo_documento' => 'CE', 'numero_documento' => '789123456', 'nombre_completo' => 'Ana Rodríguez Suárez', 'telefono' => '3004567890', 'examenes' => ['OFT', 'OPT']],
            ['tipo_documento' => 'CC', 'numero_documento' => '321654987', 'nombre_completo' => 'Pedro Sánchez Torres', 'telefono' => '3003216549', 'examenes' => ['AUD', 'ECG', 'ESP', 'SNG']],
        ];

        foreach ($pacientesData as $pacData) {
            $examenes = $pacData['examenes'];
            unset($pacData['examenes']);
            $paciente = Paciente::create($pacData);
            foreach ($examenes as $codigoExamen) {
                $tipoExamen = TipoExamen::where('codigo', $codigoExamen)->first();
                if ($tipoExamen) {
                    ExamenPaciente::create([
                        'paciente_id' => $paciente->id,
                        'tipo_examen_id' => $tipoExamen->id,
                        'estado' => EstadoExamenPaciente::Pendiente,
                    ]);
                }
            }
        }
    }
}
