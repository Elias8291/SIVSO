<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    /**
     * Crea notificaciones in-app para uno o varios usuarios (panel administración).
     */
    public function enviar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_ids'   => 'required|array|min:1|max:500',
            'user_ids.*' => 'integer|exists:users,id',
            'titulo'     => 'required|string|max:255',
            'mensaje'    => 'required|string|max:5000',
            'tipo'       => 'nullable|string|in:info,exito,advertencia,error',
            'enlace'     => 'nullable|string|max:500',
        ]);

        $tipo = $data['tipo'] ?? 'info';
        $now  = now();
        $ids  = collect($data['user_ids'])->unique()->values();

        $rows = $ids->map(fn (int $uid) => [
            'user_id'    => $uid,
            'titulo'     => $data['titulo'],
            'mensaje'    => $data['mensaje'],
            'tipo'       => $tipo,
            'enlace'     => $data['enlace'] ?? null,
            'leida_en'   => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('notificaciones')->insert($rows);

        return response()->json([
            'message' => 'Notificaciones enviadas.',
            'count'   => count($rows),
        ], 201);
    }
}
