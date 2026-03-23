<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notificacion::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->has('no_leidas')) {
            $query->whereNull('leida_en');
        }

        $notificaciones = $query->limit(50)->get();

        $noLeidas = Notificacion::where('user_id', $request->user()->id)
            ->whereNull('leida_en')
            ->count();

        return response()->json([
            'data'      => $notificaciones,
            'no_leidas' => $noLeidas,
        ]);
    }

    public function conteo(Request $request): JsonResponse
    {
        $count = Notificacion::where('user_id', $request->user()->id)
            ->whereNull('leida_en')
            ->count();

        return response()->json(['no_leidas' => $count]);
    }

    public function marcarLeida(int $id, Request $request): JsonResponse
    {
        $notif = Notificacion::where('user_id', $request->user()->id)->findOrFail($id);
        $notif->update(['leida_en' => now()]);

        return response()->json(['ok' => true]);
    }

    public function marcarTodasLeidas(Request $request): JsonResponse
    {
        Notificacion::where('user_id', $request->user()->id)
            ->whereNull('leida_en')
            ->update(['leida_en' => now()]);

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $notif = Notificacion::where('user_id', $request->user()->id)->findOrFail($id);
        $notif->delete();

        return response()->json(['ok' => true]);
    }
}
