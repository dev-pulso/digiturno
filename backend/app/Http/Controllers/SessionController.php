<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->attributes->get('consalud.identity')]);
    }
}
