<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\User;
use App\Services\EmpleadoUsuarioVinculacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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

        $data = $request->validate([
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $passwordInicial = substr($rfcNorm, -8);

        $nombreCompleto = trim(implode(' ', array_filter([
            $e->nombre,
            $e->apellido_paterno,
            $e->apellido_materno,
        ])));

        $name = $nombreCompleto !== '' ? $nombreCompleto : 'Usuario';

        try {
            $result = EmpleadoUsuarioVinculacionService::crearOReutilizarParaEmpleado(
                $e,
                $rfcNorm,
                $data['email'] ?? null,
                $passwordInicial,
                $name,
                true,
            );
        } catch (\RuntimeException $ex) {
            $map = [
                'empleado_ya_vinculado' => 'Este colaborador ya tiene un usuario vinculado.',
                'rfc_nue_mismatch' => 'Ya existe un usuario con ese RFC asociado a otro NUE distinto al de este colaborador.',
                'rfc_duplicado' => 'Ya existe otro usuario con ese RFC.',
                'email_duplicado' => 'Ya existe un usuario con ese correo electrónico.',
            ];
            $code = $ex->getMessage();

            return response()->json([
                'message' => $map[$code] ?? 'No se pudo registrar el usuario.',
            ], 422);
        }

        $user = $result['user'];
        $messages = [
            'created' => 'Usuario creado. El colaborador debe iniciar sesión con su RFC; la contraseña temporal son los últimos 8 caracteres del RFC. En el primer acceso se le pedirá cambiar la contraseña.',
            'reused_rfc' => 'Ya existía un usuario con ese RFC; se vinculó a este colaborador.',
            'reused_nue' => 'Ya existía un usuario con el NUE de este colaborador; se actualizó el RFC y la contraseña (últimos 8 caracteres del RFC) y se vinculó al colaborador. Debe cambiar la contraseña en el primer acceso.',
        ];
        $message = $messages[$result['reused']] ?? $messages['created'];
        $status = $result['reused'] === 'created' ? 201 : 200;

        return response()->json([
            'message' => $message,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'rfc' => $user->rfc,
                'email' => $user->email,
            ],
        ], $status);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $delegaciones = collect();
        $urFiltro = strtoupper(trim((string) $request->get('ur', '')));
        if ($urFiltro === '') {
            $urFiltro = null;
        }

        $delegado = Delegado::where('user_id', $user->id)->first();

        if ($delegado) {
            $qDelegaciones = DB::table('delegado_delegacion AS dd')
                ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                ->leftJoin('users AS du', 'du.id', '=', 'd.user_id')
                ->where('dd.delegado_id', $delegado->id)
                ->select([
                    'dd.delegado_id',
                    'd.nombre',
                    'dl.id AS delegacion_id',
                    'dl.clave',
                    'dd.ur AS ur',
                    'du.name AS delegado_user_name',
                    'du.rfc AS delegado_user_rfc',
                ])
                ->orderBy('dl.clave');
            if ($urFiltro !== null) {
                $qDelegaciones->where('dd.ur', $urFiltro);
            }
            $delegaciones = $qDelegaciones->get();
        }

        if ($delegaciones->isEmpty() && $user->nue) {
            $empleado = Empleado::where('nue', $user->nue)->first();
            if ($empleado && $empleado->delegacion_id) {
                $qDelegaciones = DB::table('delegado_delegacion AS dd')
                    ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                    ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                    ->leftJoin('users AS du', 'du.id', '=', 'd.user_id')
                    ->where('dd.delegacion_id', $empleado->delegacion_id)
                    ->select([
                        'dd.delegado_id',
                        'd.nombre',
                        'dl.id AS delegacion_id',
                        'dl.clave',
                        'dd.ur AS ur',
                        'du.name AS delegado_user_name',
                        'du.rfc AS delegado_user_rfc',
                    ]);
                if ($urFiltro !== null) {
                    $qDelegaciones->where('dd.ur', $urFiltro);
                }
                $delegaciones = $qDelegaciones->get();
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
                'ur' => $d->ur,
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

    /**
     * Años en los que el colaborador tiene al menos una selección de vestuario (para el selector del PDF).
     */
    public function aniosAcusePdfEmpleado(Request $request, int $empleado): JsonResponse
    {
        if (! $this->usuarioPuedeConsultarAniosAcuseEmpleado($request, $empleado)) {
            return response()->json(['message' => 'No tiene permiso para consultar este colaborador.'], 403);
        }

        if (! Empleado::find($empleado)) {
            return response()->json(['message' => 'Colaborador no encontrado.'], 404);
        }

        $anios = DB::table('selecciones')
            ->where('empleado_id', $empleado)
            ->select('anio')
            ->groupBy('anio')
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(fn ($a) => (int) $a)
            ->values()
            ->all();

        return response()->json(['anios' => $anios]);
    }

    /**
     * Años en los que al menos un colaborador de la delegación tiene selecciones (para PDF en lote).
     */
    public function aniosAcusePdfDelegacion(Request $request, int $delegacion): JsonResponse
    {
        if (! $this->usuarioPuedeConsultarAniosAcuseDelegacion($request, $delegacion)) {
            return response()->json(['message' => 'No tiene permiso para consultar esta delegación.'], 403);
        }

        if (! DB::table('delegaciones')->where('id', $delegacion)->exists()) {
            return response()->json(['message' => 'Delegación no encontrada.'], 404);
        }

        $anios = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->where('e.delegacion_id', $delegacion)
            ->select('s.anio')
            ->groupBy('s.anio')
            ->orderByDesc('s.anio')
            ->pluck('s.anio')
            ->map(fn ($a) => (int) $a)
            ->values()
            ->all();

        return response()->json(['anios' => $anios]);
    }

    private function usuarioPuedeConsultarAniosAcuseEmpleado(Request $request, int $empleadoId): bool
    {
        if ($request->user()->can('ver_empleados')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegadoPuedeGestionarEmpleadoId($request, $empleadoId);
    }

    private function usuarioPuedeConsultarAniosAcuseDelegacion(Request $request, int $delegacionId): bool
    {
        if ($request->user()->can('ver_empleados') || $request->user()->can('ver_delegaciones')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegacionIdsQueGestionaElUsuario($request)->contains($delegacionId);
    }
}
