<?php

namespace App\Modules\Display\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class TtsController extends Controller
{
    public function anunciar(Request $request): JsonResponse
    {
        $request->validate([
            'texto' => 'required|string|max:255',
        ]);

        $texto = $request->input('texto');
        $escapado = escapeshellarg($texto);

        $cmd = "timeout 8 spd-say -o espeak-ng -l es-419 -t male1 -r -30 -p -15 -w {$escapado} >/dev/null 2>&1";
        exec($cmd, $output, $exitCode);

        Log::info("TTS anunciar: {$texto} (exit: {$exitCode})");

        return response()->json([
            'exito' => true,
            'texto' => $texto,
        ]);
    }
}
