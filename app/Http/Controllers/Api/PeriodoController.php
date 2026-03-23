<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
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

        $periodo = Periodo::create($data);

        return response()->json(['message' => 'Periodo creado.', 'data' => $periodo], 201);
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
            'estado' => 'required|in:abierto,cerrado,pendiente',
        ]);

        $periodo->update(['estado' => $data['estado']]);

        $notificados = 0;
        if ($data['estado'] === 'abierto') {
            $notificados = $this->notificarEmpleados($periodo);
        }

        return response()->json([
            'message'     => 'Estado actualizado.' . ($notificados > 0 ? " Se notificó a {$notificados} usuario(s)." : ''),
            'data'        => $periodo,
            'notificados' => $notificados,
        ]);
    }

    private function notificarEmpleados(Periodo $periodo): int
    {
        $anio = $periodo->anio;

        $usersConSeleccion = DB::table('empleados AS e')
            ->join('selecciones AS s', function ($j) use ($anio) {
                $j->on('s.empleado_id', '=', 'e.id')->where('s.anio', $anio);
            })
            ->whereNotNull('e.user_id')
            ->select('e.user_id')
            ->distinct()
            ->pluck('e.user_id');

        $yaActualizaron = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->whereNotNull('e.user_id')
            ->where('s.anio', $anio)
            ->where('s.updated_at', '>=', $periodo->created_at)
            ->select('e.user_id')
            ->distinct()
            ->pluck('e.user_id');

        $pendientes = $usersConSeleccion->diff($yaActualizaron);

        if ($pendientes->isEmpty()) {
            return 0;
        }

        $ahora = now();
        $rows = $pendientes->map(fn ($uid) => [
            'user_id'    => $uid,
            'titulo'     => "Periodo abierto: {$periodo->nombre}",
            'mensaje'    => "Se abrió el periodo de actualización {$periodo->nombre} ({$anio}). Revisa y actualiza tu vestuario antes del " . $periodo->fecha_fin->format('d/m/Y') . '.',
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
