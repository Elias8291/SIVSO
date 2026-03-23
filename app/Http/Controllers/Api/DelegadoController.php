<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DelegadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ur     = $request->get('ur');
        $search = trim((string) $request->get('search', ''));

        $query = DB::table('delegados AS d')
            ->join('delegado_delegacion AS dd', 'dd.delegado_id', '=', 'd.id')
            ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id');

        if ($ur) {
            $depId = DB::table('dependencias')->where('clave', $ur)->value('id');
            if ($depId) {
                $query->join('dependencia_delegacion AS dep_del', function ($j) use ($depId) {
                    $j->on('dep_del.delegacion_id', '=', 'dl.id')
                      ->where('dep_del.dependencia_id', $depId);
                });
            }
        }

        $query->when($search, fn ($q) => $q->where(fn ($q2) =>
            $q2->where('d.nombre', 'like', "%{$search}%")
               ->orWhere('dl.clave', 'like', "%{$search}%")
        ));

        $rows = $query->select([
                'd.id', 'd.nombre', 'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id',
            ])
            ->orderBy('d.nombre')
            ->limit(200)
            ->get();

        $delegacionIds = $rows->pluck('delegacion_id')->unique();
        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegacionIds)
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $data = $rows->map(fn ($d) => [
            'id'                 => $d->id,
            'clave'              => $d->delegacion_clave,
            'nombre'             => $d->nombre,
            'ur'                 => $ur,
            'trabajadores_count' => (int) ($trabCounts[$d->delegacion_id] ?? 0),
        ]);

        return response()->json(['data' => $data]);
    }

    public function resumen(Request $request): JsonResponse
    {
        $search = trim((string) $request->get('search', ''));

        $delegados = DB::table('delegados AS d')
            ->join('delegado_delegacion AS dd', 'dd.delegado_id', '=', 'd.id')
            ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
            ->leftJoin('users AS u', 'u.id', '=', 'd.user_id')
            ->select([
                'd.id', 'd.nombre', 'd.user_id',
                'u.name AS user_name', 'u.rfc AS user_rfc',
                'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id'
            ])
            ->orderBy('d.nombre')
            ->get();

        $trabCounts = DB::table('empleados')
            ->whereNotNull('delegacion_id')
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $byId = [];
        foreach ($delegados as $d) {
            if (! isset($byId[$d->id])) {
                $byId[$d->id] = [
                    'id'                 => $d->id,
                    'nombre'             => $d->nombre,
                    'user_id'            => $d->user_id,
                    'user'               => $d->user_id ? [
                        'id'   => $d->user_id,
                        'name' => $d->user_name,
                        'rfc'  => $d->user_rfc,
                    ] : null,
                    'delegaciones_count' => 0,
                    'delegaciones'       => [],
                    'trabajadores_total' => 0,
                ];
            }

            $cnt = (int) ($trabCounts[$d->delegacion_id] ?? 0);
            $byId[$d->id]['delegaciones_count']++;
            $byId[$d->id]['delegaciones'][] = [
                'id'                 => $d->delegacion_id,
                'clave'              => $d->delegacion_clave,
                'trabajadores_count' => $cnt,
            ];
            $byId[$d->id]['trabajadores_total'] += $cnt;
        }

        if ($search) {
            $byId = array_filter($byId, fn ($v) =>
                stripos($v['nombre'], $search) !== false ||
                ($v['user'] && stripos($v['user']['rfc'], $search) !== false) ||
                collect($v['delegaciones'])->contains(fn ($del) => stripos($del['clave'], $search) !== false)
            );
        }

        return response()->json(['data' => array_values($byId)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:120',
            'delegacion_id' => 'required|integer|exists:delegaciones,id',
            'user_id'       => 'nullable|integer|exists:users,id',
        ]);

        if (! empty($data['user_id'])) {
            Delegado::where('user_id', $data['user_id'])->update(['user_id' => null]);
        }

        $delegado = Delegado::create([
            'nombre'  => strtoupper(trim($data['nombre'])),
            'user_id' => $data['user_id'] ?? null,
        ]);

        $delegado->delegaciones()->attach($data['delegacion_id']);

        return response()->json(['message' => 'Delegado creado correctamente.', 'id' => $delegado->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $data = $request->validate([
            'nombre'  => 'required|string|max:120',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        if (! empty($data['user_id'])) {
            Delegado::where('user_id', $data['user_id'])->where('id', '!=', $delegado->id)->update(['user_id' => null]);
        }

        $delegado->update([
            'nombre'  => strtoupper(trim($data['nombre'])),
            'user_id' => $data['user_id'] ?? null,
        ]);

        return response()->json(['message' => 'Delegado actualizado correctamente.']);
    }

    public function crearUsuario(Request $request, int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        if ($delegado->user_id) {
            return response()->json(['message' => 'Este delegado ya tiene un usuario vinculado.'], 422);
        }

        $data = $request->validate([
            'rfc'                 => ['required', 'string', 'max:20', 'unique:users,rfc'],
            'email'               => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password'            => 'required|string|min:8|confirmed',
            'name'                => 'nullable|string|max:255',
        ]);

        $name = ! empty($data['name']) ? trim($data['name']) : ($delegado->nombre ?: 'Delegado');

        $user = \App\Models\User::create([
            'name'     => $name,
            'rfc'      => strtoupper(trim($data['rfc'])),
            'email'    => $data['email'] ?? null,
            'password' => $data['password'],
            'activo'   => true,
        ]);

        $user->assignRole('delegado');
        // También le asignamos el rol de empleado ya que el delegado también es un empleado con vestuario
        $user->assignRole('empleado');

        Delegado::where('user_id', $user->id)->where('id', '!=', $delegado->id)->update(['user_id' => null]);

        $delegado->user_id = $user->id;
        $delegado->save();

        return response()->json([
            'message' => 'Usuario creado y vinculado correctamente.',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'rfc'   => $user->rfc,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $delegado->delegaciones()->detach();
        $delegado->delete();

        return response()->json(['message' => 'Delegado eliminado correctamente.']);
    }
}
