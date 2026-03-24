<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
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
            $ids = DB::table('delegado_delegacion AS dd')
                ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                ->whereRaw('TRIM(d.nombre) = ?', [trim($delegado->nombre)])
                ->pluck('dd.delegacion_id');
        }
        if ($ids->isEmpty() && $user->nue) {
            $emp = Empleado::where('nue', $user->nue)->first();
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
                ->whereRaw('TRIM(d.nombre) = ?', [trim($delegado->nombre)])
                ->select(['dd.delegado_id', 'd.nombre', 'dl.id AS delegacion_id', 'dl.clave'])
                ->orderBy('dl.clave')
                ->get();
        }

        if ($delegaciones->isEmpty() && $user->nue) {
            $empleado = Empleado::where('nue', $user->nue)->first();
            if ($empleado && $empleado->delegacion_id) {
                $delegaciones = DB::table('delegado_delegacion AS dd')
                    ->join('delegaciones AS dl', 'dl.id', '=', 'dd.delegacion_id')
                    ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
                    ->where('dd.delegacion_id', $empleado->delegacion_id)
                    ->select(['dd.delegado_id', 'd.nombre', 'dl.id AS delegacion_id', 'dl.clave'])
                    ->get();
            }
        }

        if ($delegaciones->isEmpty()) {
            $message = $delegado
                ? 'No se encontraron delegaciones para este delegado.'
                : ($user->nue
                    ? 'Tu NUE no tiene delegación asignada en el padrón.'
                    : 'Asigna un delegado en Mi Cuenta o vincula tu NUE.');

            return response()->json(['data' => [], 'message' => $message]);
        }

        $trabCounts = DB::table('empleados')
            ->whereIn('delegacion_id', $delegaciones->pluck('delegacion_id')->unique())
            ->selectRaw('delegacion_id, COUNT(*) AS cnt')
            ->groupBy('delegacion_id')
            ->pluck('cnt', 'delegacion_id');

        $data = $delegaciones->map(fn ($d) => [
            'id' => $d->delegacion_id,
            'clave' => $d->clave,
            'delegado_nombre' => $d->nombre,
            'trabajadores_count' => (int) ($trabCounts[$d->delegacion_id] ?? 0),
        ])->values()->all();

        return response()->json(['data' => $data]);
    }
}
