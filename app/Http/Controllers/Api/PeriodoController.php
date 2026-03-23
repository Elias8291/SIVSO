<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        return response()->json(['message' => 'Estado actualizado.', 'data' => $periodo]);
    }

    public function destroy(int $id): JsonResponse
    {
        $periodo = Periodo::findOrFail($id);
        $periodo->delete();

        return response()->json(['message' => 'Periodo eliminado.']);
    }
}
