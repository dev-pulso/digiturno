<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Turn;
use App\Models\TurnLog;
use App\Enums\TurnStatus;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TurnSeeder extends Seeder
{
    public function run(): void
    {
        $mg = Area::where('code', 'mg')->first();
        $es = Area::where('code', 'es')->first();
        $lab = Area::where('code', 'lab')->first();

        if (!$mg) return;

        // Create some turns for demo
        $turnsData = [
            ['area_id' => $mg->id, 'patient_name' => 'María Rodríguez', 'status' => TurnStatus::Calling, 'called_at' => now()->subMinutes(3)],
            ['area_id' => $mg->id, 'patient_name' => 'Juan Carlos Pérez', 'status' => TurnStatus::Waiting],
            ['area_id' => $mg->id, 'patient_name' => 'Ana María López', 'status' => TurnStatus::Waiting],
            ['area_id' => $mg->id, 'patient_name' => 'Carlos Martínez', 'status' => TurnStatus::Waiting],
            ['area_id' => $mg->id, 'patient_name' => 'Sofía Gómez', 'status' => TurnStatus::Completed, 'completed_at' => now()->subMinutes(15)],
            ['area_id' => $es->id, 'patient_name' => 'Luis Alberto Ruiz', 'status' => TurnStatus::Waiting],
            ['area_id' => $es->id, 'patient_name' => 'Carmen Torres', 'status' => TurnStatus::Waiting],
            ['area_id' => $lab->id, 'patient_name' => 'Andrés Vargas', 'status' => TurnStatus::Calling, 'called_at' => now()->subMinute()],
            ['area_id' => $lab->id, 'patient_name' => 'Patricia Herrera', 'status' => TurnStatus::Waiting],
        ];

        $counters = [];

        foreach ($turnsData as $data) {
            $area = Area::find($data['area_id']);
            if (!isset($counters[$data['area_id']])) {
                $counters[$data['area_id']] = 0;
            }
            $counters[$data['area_id']]++;
            $num = $area->prefix . '-' . str_pad($counters[$data['area_id']], 3, '0', STR_PAD_LEFT);

            $turn = Turn::create([
                'turn_number' => $num,
                'area_id' => $data['area_id'],
                'patient_name' => $data['patient_name'],
                'status' => $data['status'],
                'source' => 'reception',
                'called_at' => $data['called_at'] ?? null,
                'completed_at' => $data['completed_at'] ?? null,
                'created_at' => now()->subHours(rand(1, 4)),
            ]);

            TurnLog::create([
                'turn_id' => $turn->id,
                'action' => 'created',
                'new_status' => 'waiting',
            ]);
        }
    }
}
