<?php

namespace App\Modules\Admin\Controllers;

use App\Models\Video;
use App\Modules\Admin\Resources\VideoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ControladorVideo extends Controller
{
    public function index(): JsonResponse
    {
        $videos = Video::ordenado()->get();
        return response()->json(VideoResource::collection($videos));
    }

    public function playlist(): JsonResponse
    {
        $videos = Video::activo()->ordenado()->get();
        return response()->json(VideoResource::collection($videos));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'video' => 'required|file|mimes:mp4,webm,ogg,avi,mov|max:204800',
        ]);

        $file = $request->file('video');
        $archivo = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->storeAs('videos', $archivo, 'public');

        $maxOrden = Video::max('orden') ?? 0;

        $video = Video::create([
            'titulo' => $request->titulo,
            'archivo' => $archivo,
            'nombre_original' => $file->getClientOriginalName(),
            'tipo_mime' => $file->getMimeType(),
            'tamano' => $file->getSize(),
            'orden' => $maxOrden + 1,
            'activo' => true,
        ]);

        return response()->json(new VideoResource($video), 201);
    }

    public function update(Request $request, Video $video): JsonResponse
    {
        $request->validate([
            'titulo' => 'sometimes|string|max:255',
            'activo' => 'boolean',
        ]);

        $video->update($request->only(['titulo', 'activo']));
        return response()->json(new VideoResource($video));
    }

    public function destroy(Video $video): JsonResponse
    {
        Storage::disk('public')->delete('videos/' . $video->archivo);
        $video->delete();
        return response()->json(['mensaje' => 'Video eliminado']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:videos,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Video::where('id', $id)->update(['orden' => $index]);
        }

        return response()->json(['mensaje' => 'Orden actualizado']);
    }

    public function toggle(Video $video): JsonResponse
    {
        $video->update(['activo' => !$video->activo]);
        return response()->json(new VideoResource($video));
    }
}
