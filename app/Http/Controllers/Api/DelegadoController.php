<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use App\Support\BusquedaTextoSql;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DelegadoController extends Controller
{
    /**
     * @param  array{delegacion_id?: int}  $contextoCreacion  Solo para alta: delegación única asignada.
     */
    private function validarEmpleadoIdParaDelegado(Delegado $delegado, ?int $empleadoId, ?int $userIdEfectivo, ?int $delegacionIdAlCrear): ?JsonResponse
    {
        if ($empleadoId === null) {
            return null;
        }

        $emp = Empleado::find($empleadoId);
        if (! $emp) {
            return response()->json(['message' => 'Empleado no encontrado.'], 422);
        }

        if ($delegacionIdAlCrear !== null) {
            if ((int) $emp->delegacion_id !== (int) $delegacionIdAlCrear) {
                return response()->json(['message' => 'El empleado no pertenece a la delegación seleccionada.'], 422);
            }
        } else {
            $delegado->loadMissing('delegaciones');
            $ids = $delegado->delegaciones->pluck('id');
            if (! $ids->contains($emp->delegacion_id)) {
                return response()->json(['message' => 'El empleado no pertenece a ninguna delegación asignada a este delegado.'], 422);
            }
        }

        if ($emp->user_id && $userIdEfectivo && (int) $emp->user_id !== (int) $userIdEfectivo) {
            return response()->json(['message' => 'El empleado ya está vinculado a otro usuario. Quite esa vinculación o use el usuario existente.'], 422);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $ur = $request->get('ur');
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

        $query->when($search !== '', function ($q) use ($search) {
            $tokens = preg_split('/\s+/u', trim($search), -1, PREG_SPLIT_NO_EMPTY);
            foreach ($tokens as $token) {
                $q->where(function ($q2) use ($token) {
                    $ascii = Str::ascii($token);
                    $foldPattern = '%'.BusquedaTextoSql::escapeLike(mb_strtoupper($ascii !== '' ? $ascii : $token, 'UTF-8')).'%';
                    $likeT = '%'.BusquedaTextoSql::escapeLike($token).'%';
                    $likeA = ($ascii !== '' && $ascii !== $token) ? '%'.BusquedaTextoSql::escapeLike($ascii).'%' : null;

                    $q2->where(function ($q3) use ($likeT, $likeA, $foldPattern) {
                        $q3->where('d.nombre', 'like', $likeT)
                            ->orWhere('dl.clave', 'like', $likeT);
                        if ($likeA !== null) {
                            $q3->orWhere('d.nombre', 'like', $likeA)
                                ->orWhere('dl.clave', 'like', $likeA);
                        }
                        $q3->orWhereRaw(BusquedaTextoSql::sqlSpanishFoldUpper('d.nombre').' LIKE ?', [$foldPattern])
                            ->orWhereRaw(BusquedaTextoSql::sqlSpanishFoldUpper('dl.clave').' LIKE ?', [$foldPattern]);
                    });
                });
            }
        });

        $rows = $query->select([
            'd.id', 'd.nombre', 'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id',
        ])
            ->orderBy('dl.clave')
            ->orderBy('d.id')
            ->limit(200)
            ->get();

        $delegacionIds = $rows->pluck('delegacion_id')->unique();
        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegacionIds)
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $data = $rows->map(fn ($d) => [
            'id' => $d->id,
            'clave' => $d->delegacion_clave,
            'nombre' => $d->nombre,
            'ur' => $ur,
            'trabajadores_count' => (int) ($trabCounts[$d->delegacion_id] ?? 0),
        ]);

        return response()->json(['data' => $data]);
    }

    public function resumen(Request $request): JsonResponse
    {
        $search = trim((string) $request->get('search', ''));
        $tieneEmpleadoId = Schema::hasColumn('delegados', 'empleado_id');

        $base = DB::table('delegados AS d')
            ->join('delegado_delegacion AS dd', 'dd.delegado_id', '=', 'd.id')
            ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
            ->leftJoin('users AS u', 'u.id', '=', 'd.user_id');

        if ($tieneEmpleadoId) {
            $base->leftJoin('empleados AS emp', 'emp.id', '=', 'd.empleado_id');
            $delegados = $base
                ->select([
                    'd.id', 'd.nombre', 'd.user_id', 'd.empleado_id',
                    'u.name AS user_name', 'u.rfc AS user_rfc',
                    'emp.nue AS empleado_nue',
                    'emp.nombre AS emp_nombre',
                    'emp.apellido_paterno AS emp_ap_pat',
                    'emp.apellido_materno AS emp_ap_mat',
                    'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id',
                ])
                ->orderBy('dl.clave')
                ->orderBy('d.id')
                ->get();
        } else {
            $delegados = $base
                ->select([
                    'd.id', 'd.nombre', 'd.user_id',
                    'u.name AS user_name', 'u.rfc AS user_rfc',
                    'dl.clave AS delegacion_clave', 'dl.id AS delegacion_id',
                ])
                ->orderBy('dl.clave')
                ->orderBy('d.id')
                ->get();
        }

        $trabCounts = DB::table('empleados')
            ->whereNotNull('delegacion_id')
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $byId = [];
        foreach ($delegados as $d) {
            if (! isset($byId[$d->id])) {
                $empleadoId = $tieneEmpleadoId ? $d->empleado_id : null;
                $empleadoPayload = null;
                if ($tieneEmpleadoId && $empleadoId) {
                    $nombreCompleto = trim(implode(' ', array_filter([
                        $d->emp_nombre ?? '',
                        $d->emp_ap_pat ?? '',
                        $d->emp_ap_mat ?? '',
                    ])));
                    $empleadoPayload = [
                        'id' => (int) $empleadoId,
                        'nue' => $d->empleado_nue ?? null,
                        'nombre_completo' => $nombreCompleto !== '' ? $nombreCompleto : null,
                    ];
                }

                $byId[$d->id] = [
                    'id' => $d->id,
                    'nombre' => $d->nombre,
                    'user_id' => $d->user_id,
                    'empleado_id' => $empleadoId,
                    'empleado' => $empleadoPayload,
                    'user' => $d->user_id ? [
                        'id' => $d->user_id,
                        'name' => $d->user_name,
                        'rfc' => $d->user_rfc,
                    ] : null,
                    'delegaciones_count' => 0,
                    'delegaciones' => [],
                    'trabajadores_total' => 0,
                ];
            }

            $cnt = (int) ($trabCounts[$d->delegacion_id] ?? 0);
            $byId[$d->id]['delegaciones_count']++;
            $byId[$d->id]['delegaciones'][] = [
                'id' => $d->delegacion_id,
                'clave' => $d->delegacion_clave,
                'trabajadores_count' => $cnt,
            ];
            $byId[$d->id]['trabajadores_total'] += $cnt;
        }

        if ($search !== '') {
            $byId = array_filter($byId, function ($v) use ($search) {
                $partes = [
                    (string) ($v['nombre'] ?? ''),
                    (string) (($v['user'] ?? [])['rfc'] ?? ''),
                ];
                foreach ($v['delegaciones'] ?? [] as $del) {
                    $partes[] = (string) ($del['clave'] ?? '');
                }
                if (! empty($v['empleado']['nombre_completo'])) {
                    $partes[] = (string) $v['empleado']['nombre_completo'];
                }
                if (! empty($v['empleado']['nue'])) {
                    $partes[] = (string) $v['empleado']['nue'];
                }

                $haystack = implode(' ', array_filter($partes));

                return BusquedaTextoSql::phpHaystackTieneTokens($haystack, $search);
            });
        }

        return response()->json(['data' => array_values($byId)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'nullable|string|max:120',
            'delegacion_id' => 'nullable|integer|exists:delegaciones,id',
            'ur' => 'nullable|string|max:5',
            'delegacion' => 'nullable|string|max:20',
            'user_id' => 'nullable|integer|exists:users,id',
            'empleado_id' => 'nullable|integer|exists:empleados,id',
        ]);

        $delegacionId = $data['delegacion_id'] ?? null;
        if (! $delegacionId) {
            $urClave = strtoupper(trim((string) ($data['ur'] ?? '')));
            $delClave = strtoupper(preg_replace('/\s+/', '', trim((string) ($data['delegacion'] ?? ''))));
            if ($urClave !== '' && $delClave !== '') {
                $depId = DB::table('dependencias')->where('clave', $urClave)->value('id');
                $delRowId = DB::table('delegaciones')->where('clave', $delClave)->value('id');
                if ($depId && $delRowId) {
                    $enUr = DB::table('dependencia_delegacion')
                        ->where('dependencia_id', $depId)
                        ->where('delegacion_id', $delRowId)
                        ->exists();
                    if ($enUr) {
                        $delegacionId = (int) $delRowId;
                    }
                }
            }
        }

        if (! $delegacionId) {
            return response()->json([
                'message' => 'Indica delegación válida: delegacion_id o pareja UR + código de delegación.',
            ], 422);
        }

        if ($blocked = $this->validarEmpleadoIdParaDelegado(
            new Delegado,
            $data['empleado_id'] ?? null,
            $data['user_id'] ?? null,
            (int) $delegacionId
        )) {
            return $blocked;
        }

        if (! empty($data['user_id'])) {
            Delegado::where('user_id', $data['user_id'])->update(['user_id' => null]);
        }

        $nombreNorm = strtoupper(trim((string) ($data['nombre'] ?? '')));

        $delegado = Delegado::create([
            'nombre' => $nombreNorm,
            'user_id' => $data['user_id'] ?? null,
            'empleado_id' => $data['empleado_id'] ?? null,
        ]);

        $delegado->delegaciones()->attach($delegacionId);

        return response()->json(['message' => 'Delegado creado correctamente.', 'id' => $delegado->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $delegado = Delegado::find($id);
        if (! $delegado) {
            return response()->json(['message' => 'Delegado no encontrado.'], 404);
        }

        $data = $request->validate([
            'nombre' => 'nullable|string|max:120',
            'user_id' => 'nullable|integer|exists:users,id',
            'empleado_id' => 'nullable|integer|exists:empleados,id',
        ]);

        $userIdEfectivo = array_key_exists('user_id', $data) ? $data['user_id'] : $delegado->user_id;
        $nuevoEmpleadoId = array_key_exists('empleado_id', $data)
            ? $data['empleado_id']
            : $delegado->empleado_id;

        if ($blocked = $this->validarEmpleadoIdParaDelegado(
            $delegado,
            $nuevoEmpleadoId,
            $userIdEfectivo ? (int) $userIdEfectivo : null,
            null
        )) {
            return $blocked;
        }

        if (! empty($data['user_id'])) {
            Delegado::where('user_id', $data['user_id'])->where('id', '!=', $delegado->id)->update(['user_id' => null]);
        }

        $nombreNuevo = array_key_exists('nombre', $data)
            ? strtoupper(trim((string) $data['nombre']))
            : $delegado->nombre;

        $delegado->update([
            'nombre' => $nombreNuevo,
            'user_id' => array_key_exists('user_id', $data) ? $data['user_id'] : $delegado->user_id,
            'empleado_id' => array_key_exists('empleado_id', $data) ? $data['empleado_id'] : $delegado->empleado_id,
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

        if ($delegado->empleado_id) {
            $empPrevio = Empleado::find($delegado->empleado_id);
            if ($empPrevio && $empPrevio->user_id) {
                return response()->json([
                    'message' => 'El empleado vinculado a este delegado ya tiene usuario. Quite la vinculación en el padrón o use “Vincular a usuario existente”.',
                ], 422);
            }
        }

        $data = $request->validate([
            'rfc' => ['required', 'string', 'max:20', 'unique:users,rfc'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => 'required|string|min:8|confirmed',
            'name' => 'nullable|string|max:255',
        ]);

        $name = ! empty($data['name']) ? trim($data['name']) : ($delegado->nombre ?: 'Delegado');

        try {
            return DB::transaction(function () use ($data, $delegado, $name) {
                $user = User::create([
                    'name' => $name,
                    'rfc' => strtoupper(trim($data['rfc'])),
                    'email' => $data['email'] ?? null,
                    'password' => $data['password'],
                    'activo' => true,
                ]);

                $user->assignRole('delegado');
                $user->assignRole('empleado');

                Delegado::where('user_id', $user->id)->where('id', '!=', $delegado->id)->update(['user_id' => null]);

                $delegado->user_id = $user->id;
                $delegado->save();

                $empleadoVinculado = false;
                if ($delegado->empleado_id) {
                    $emp = Empleado::lockForUpdate()->find($delegado->empleado_id);
                    if ($emp) {
                        if ($emp->user_id) {
                            throw new \RuntimeException('empleado_ocupado');
                        }
                        Empleado::where('user_id', $user->id)->where('id', '!=', $emp->id)->update(['user_id' => null]);
                        $emp->user_id = $user->id;
                        $emp->save();
                        if ($emp->nue) {
                            $user->nue = $emp->nue;
                            $user->save();
                        }
                        $empleadoVinculado = true;
                    }
                }

                $msg = $empleadoVinculado
                    ? 'Usuario creado y vinculado al delegado y al registro de empleado (Mismo acceso para Mi vestuario y Mi delegación).'
                    : 'Usuario creado y vinculado correctamente al delegado.';

                return response()->json([
                    'message' => $msg,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'rfc' => $user->rfc,
                        'email' => $user->email,
                        'nue' => $user->nue,
                    ],
                    'empleado_vinculado' => $empleadoVinculado,
                ], 201);
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'empleado_ocupado') {
                return response()->json([
                    'message' => 'El registro de empleado quedó vinculado a otro usuario. Actualice la pantalla e intente de nuevo.',
                ], 409);
            }

            throw $e;
        }
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
