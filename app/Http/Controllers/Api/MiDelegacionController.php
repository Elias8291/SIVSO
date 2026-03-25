<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MiDelegacionController extends Controller
{
    private function delegacionIdsQueGestionaElUsuario(Request $request): Collection
    {
        $user = $request->user();
        $delegado = Delegado::where('user_id', $user->id)->first();
        $ids = collect();
        if ($delegado) {
            $ids = DB::table('delegado_delegacion')
                ->where('delegado_id', $delegado->id)
                ->pluck('delegacion_id');
        }
        if ($ids->isEmpty()) {
            $emp = null;
            $nueTrim = trim((string) ($user->nue ?? ''));
            if ($nueTrim !== '') {
                $emp = Empleado::where('nue', $nueTrim)->first();
            }
            if (! $emp && $user instanceof User) {
                $emp = Empleado::where('user_id', $user->id)->first();
            }
            if (! $emp && $user instanceof User) {
                $del = Delegado::where('user_id', $user->id)->whereNotNull('empleado_id')->first();
                if ($del) {
                    $emp = Empleado::find($del->empleado_id);
                }
            }
            if ($emp && $emp->delegacion_id) {
                $ids = DB::table('delegado_delegacion AS dd')
                    ->where('dd.delegacion_id', $emp->delegacion_id)
                    ->pluck('dd.delegacion_id');
            }
        }

        return $ids->unique()->values();
    }

    private function delegadoPuedeGestionarEmpleadoId(Request $request, int $empleadoId): bool
    {
        $emp = Empleado::find($empleadoId);
        if (! $emp || ! $emp->delegacion_id) {
            return false;
        }

        return $this->delegacionIdsQueGestionaElUsuario($request)->contains($emp->delegacion_id);
    }

    /**
     * Crea usuario para un colaborador de la delegación: RFC como login, contraseña = últimos 8 caracteres del RFC,
     * y obliga a cambiar contraseña en el primer acceso.
     */
    public function crearUsuarioEmpleado(Request $request, int $empleado): JsonResponse
    {
        if (! $this->delegadoPuedeGestionarEmpleadoId($request, $empleado)) {
            return response()->json(['message' => 'No tiene permiso para dar de alta usuarios de este colaborador.'], 403);
        }

        $e = Empleado::find($empleado);
        if (! $e) {
            return response()->json(['message' => 'Colaborador no encontrado.'], 404);
        }

        if ($e->user_id) {
            return response()->json(['message' => 'Este colaborador ya tiene un usuario vinculado.'], 422);
        }

        $rfcNorm = strtoupper(preg_replace('/\s+/', '', trim((string) $request->input('rfc', ''))));
        if (strlen($rfcNorm) < 8 || strlen($rfcNorm) > 20) {
            return response()->json(['message' => 'RFC inválido. Debe tener entre 8 y 20 caracteres (sin espacios).'], 422);
        }

        if (User::where('rfc', $rfcNorm)->exists()) {
            return response()->json(['message' => 'Ya existe un usuario registrado con ese RFC.'], 422);
        }

        $data = $request->validate([
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
        ]);

        $passwordInicial = substr($rfcNorm, -8);

        $nombreCompleto = trim(implode(' ', array_filter([
            $e->nombre,
            $e->apellido_paterno,
            $e->apellido_materno,
        ])));

        $name = $nombreCompleto !== '' ? $nombreCompleto : 'Usuario';

        $user = User::create([
            'name' => $name,
            'rfc' => $rfcNorm,
            'email' => $data['email'] ?? null,
            'password' => $passwordInicial,
            'nue' => $e->nue,
            'activo' => true,
            'must_change_password' => true,
        ]);

        $user->assignRole('empleado');

        Empleado::where('user_id', $user->id)->where('id', '!=', $e->id)->update(['user_id' => null]);

        $e->user_id = $user->id;
        $e->save();

        return response()->json([
            'message' => 'Usuario creado. El colaborador debe iniciar sesión con su RFC; la contraseña temporal son los últimos 8 caracteres del RFC. En el primer acceso se le pedirá cambiar la contraseña.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'rfc' => $user->rfc,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $delegaciones = collect();

        $delegado = Delegado::where('user_id', $user->id)->first();

        if ($delegado) {
            $delegaciones = DB::table('delegado_delegacion AS dd')
                ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                ->leftJoin('users AS du', 'du.id', '=', 'd.user_id')
                ->where('dd.delegado_id', $delegado->id)
                ->select([
                    'dd.delegado_id',
                    'd.nombre',
                    'dl.id AS delegacion_id',
                    'dl.clave',
                    'du.name AS delegado_user_name',
                    'du.rfc AS delegado_user_rfc',
                ])
                ->orderBy('dl.clave')
                ->get();
        }

        if ($delegaciones->isEmpty() && $user->nue) {
            $empleado = Empleado::where('nue', $user->nue)->first();
            if ($empleado && $empleado->delegacion_id) {
                $delegaciones = DB::table('delegado_delegacion AS dd')
                    ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                    ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                    ->leftJoin('users AS du', 'du.id', '=', 'd.user_id')
                    ->where('dd.delegacion_id', $empleado->delegacion_id)
                    ->select([
                        'dd.delegado_id',
                        'd.nombre',
                        'dl.id AS delegacion_id',
                        'dl.clave',
                        'du.name AS delegado_user_name',
                        'du.rfc AS delegado_user_rfc',
                    ])
                    ->get();
            }
        }

        if ($delegaciones->isEmpty()) {
            $message = $delegado
                ? 'No se encontraron delegaciones para este delegado.'
                : ($user->nue
                    ? 'Tu NUE no tiene delegación asignada en el padrón.'
                    : 'Asigna un delegado en Mi Cuenta o vincula tu NUE.');

            return response()->json(['data' => [], 'message' => $message, 'resumen' => null]);
        }

        $delegacionIds = $delegaciones->pluck('delegacion_id')->unique()->values()->map(fn ($id) => (int) $id)->values();
        $delegadosRegistradosCount = $delegaciones->pluck('delegado_id')->unique()->count();

        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();
        $anioVigente = $periodo ? (int) $periodo->anio : (int) date('Y');

        // Claves int: pluck(cnt, delegacion_id) falla en algunos drivers (clave string vs int) y devuelve 0 al indexar.
        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegacionIds->all())
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->delegacion_id => (int) $row->cnt]);

        $actualizadosPorDelegacion = DB::table('empleados AS e')
            ->whereIn('e.delegacion_id', $delegacionIds->all())
            ->whereExists(function ($q) use ($anioVigente) {
                $q->selectRaw('1')
                    ->from('selecciones AS s')
                    ->whereColumn('s.empleado_id', 'e.id')
                    ->where('s.anio', $anioVigente);
            })
            ->groupBy('e.delegacion_id')
            ->selectRaw('e.delegacion_id, COUNT(*) AS cnt')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->delegacion_id => (int) $row->cnt]);

        $colaboradoresTotal = (int) DB::table('empleados')
            ->whereIn('delegacion_id', $delegacionIds->all())
            ->count();

        $actualizadosTotal = (int) $actualizadosPorDelegacion->values()->sum();
        $pendientes = max(0, $colaboradoresTotal - $actualizadosTotal);
        $pct = $colaboradoresTotal > 0
            ? (int) round(100 * $actualizadosTotal / $colaboradoresTotal)
            : 0;

        $data = $delegaciones->map(function ($d) use ($trabCounts, $actualizadosPorDelegacion) {
            $rfc = trim((string) ($d->delegado_user_rfc ?? ''));
            $uName = trim((string) ($d->delegado_user_name ?? ''));
            $delegadoUsuario = ($rfc !== '' || $uName !== '')
                ? ['rfc' => $rfc !== '' ? $rfc : null, 'name' => $uName !== '' ? $uName : null]
                : null;

            return [
                'id' => $d->delegacion_id,
                'clave' => $d->clave,
                'delegado_id' => (int) $d->delegado_id,
                'delegado_nombre' => trim((string) ($d->nombre ?? '')) !== '' ? trim($d->nombre) : null,
                'delegado_usuario' => $delegadoUsuario,
                'trabajadores_count' => (int) ($trabCounts->get((int) $d->delegacion_id) ?? 0),
                'actualizados_ejercicio' => (int) ($actualizadosPorDelegacion->get((int) $d->delegacion_id) ?? 0),
            ];
        })->values()->all();

        $resumen = [
            'ejercicio_vigente' => $anioVigente,
            'delegaciones_count' => $delegaciones->pluck('delegacion_id')->unique()->count(),
            'delegados_registro_count' => $delegadosRegistradosCount,
            'colaboradores_total' => $colaboradoresTotal,
            'actualizados_ejercicio' => $actualizadosTotal,
            'pendientes_actualizar' => $pendientes,
            'porcentaje_actualizado' => $pct,
            'periodo_activo' => $periodo ? [
                'id' => $periodo->id,
                'anio' => (int) $periodo->anio,
                'nombre' => $periodo->nombre,
                'fecha_fin' => $periodo->fecha_fin ? $periodo->fecha_fin->format('Y-m-d') : null,
            ] : null,
        ];

        return response()->json([
            'data' => $data,
            'resumen' => $resumen,
        ]);
    }
}
