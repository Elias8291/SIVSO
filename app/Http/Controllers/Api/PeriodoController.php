<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeriodoController extends Controller
{
    public function index(): JsonResponse
    {
        $periodos = Periodo::orderByDesc('anio')->orderBy('nombre')->get();

        return response()->json(['data' => $periodos]);
    }

    public function activo(): JsonResponse
    {
        $periodo = Periodo::where('estado', 'abierto')
            ->orderByDesc('anio')
            ->first();

        return response()->json(['data' => $periodo]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'anio'         => 'required|integer|min:2020|max:2050',
            'nombre'       => 'required|string|max:255',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'estado'       => 'required|in:abierto,cerrado,pendiente',
            'descripcion'  => 'nullable|string|max:1000',
        ]);

        $notificar = $request->boolean('notificar', true);

        $periodo = Periodo::create($data);

        $notificados = 0;
        if ($periodo->estado === 'abierto' && $notificar) {
            $notificados = $this->notificarEmpleados($periodo);
        }

        $message = 'Periodo creado.';
        if ($periodo->estado === 'abierto' && $notificar) {
            $message .= $notificados > 0
                ? " Se enviaron {$notificados} aviso(s) en el panel a empleados con cuenta."
                : ' No hay empleados con cuenta de usuario vinculada para notificar.';
        } elseif ($periodo->estado === 'abierto' && ! $notificar) {
            $message .= ' No se enviaron avisos (opción desactivada).';
        }

        return response()->json([
            'message'     => $message,
            'data'        => $periodo,
            'notificados' => $notificados,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $periodo = Periodo::findOrFail($id);

        $data = $request->validate([
            'anio'         => 'required|integer|min:2020|max:2050',
            'nombre'       => 'required|string|max:255',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'estado'       => 'required|in:abierto,cerrado,pendiente',
            'descripcion'  => 'nullable|string|max:1000',
        ]);

        $periodo->update($data);

        return response()->json(['message' => 'Periodo actualizado.', 'data' => $periodo]);
    }

    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $periodo = Periodo::findOrFail($id);

        $data = $request->validate([
            'estado'    => 'required|in:abierto,cerrado,pendiente',
            'notificar' => 'sometimes|boolean',
        ]);

        $periodo->update(['estado' => $data['estado']]);

        $notificados = 0;
        if ($data['estado'] === 'abierto' && $request->boolean('notificar', true)) {
            $notificados = $this->notificarEmpleados($periodo);
        }

        $msg = 'Estado actualizado.';
        if ($data['estado'] === 'abierto' && $request->boolean('notificar', true)) {
            $msg .= $notificados > 0
                ? " Se enviaron {$notificados} aviso(s) en el panel a empleados con cuenta."
                : ' No hay empleados con cuenta de usuario vinculada para notificar.';
        } elseif ($data['estado'] === 'abierto' && ! $request->boolean('notificar', true)) {
            $msg .= ' No se enviaron avisos (opción desactivada).';
        }

        return response()->json([
            'message'     => $msg,
            'data'        => $periodo,
            'notificados' => $notificados,
        ]);
    }

    /**
     * Aviso en panel a todos los empleados que tengan cuenta de usuario vinculada (user_id).
     * Sin cuenta en el sistema no hay destino para notificación in-app.
     */
    private function notificarEmpleados(Periodo $periodo): int
    {
        $anio = $periodo->anio;

        $userIds = DB::table('empleados')
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');

        if ($userIds->isEmpty()) {
            return 0;
        }

        $fin = $periodo->fecha_fin->format('d/m/Y');
        $ahora = now();
        $rows = $userIds->map(fn ($uid) => [
            'user_id'    => $uid,
            'titulo'     => 'Actualice su vestuario — periodo abierto',
            'mensaje'    => "Puede iniciar o completar la actualización de su vestuario en «{$periodo->nombre}» (ejercicio {$anio}). Fecha límite: {$fin}.",
            'tipo'       => 'info',
            'enlace'     => '/dashboard/mi-vestuario',
            'leida_en'   => null,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ])->all();

        DB::table('notificaciones')->insert($rows);

        return count($rows);
    }

    public function destroy(int $id): JsonResponse
    {
        $periodo = Periodo::findOrFail($id);
        $periodo->delete();

        return response()->json(['message' => 'Periodo eliminado.']);
    }
}
