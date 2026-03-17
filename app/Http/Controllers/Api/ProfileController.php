<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * GET /api/perfil
     * Datos del usuario + su registro en la tabla delegacion (si tiene NUE vinculado).
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        // Buscar el trabajador por NUE (si el usuario tiene uno registrado)
        $trabajador = null;
        if ($user->nue) {
            $trabajador = DB::table('delegacion')
                ->where('nue', $user->nue)
                ->select(['id', 'nue', 'nombre_trab', 'apellp_trab', 'apellm_trab', 'delegacion', 'ur'])
                ->first();

            if ($trabajador) {
                // Obtener el nombre de la dependencia
                $dep = DB::table('dependences')->where('key', $trabajador->ur)->first();
                $trabajador->dependencia_nombre = $dep?->name;
                $trabajador->delegacion_clave   = $trabajador->delegacion;
                $trabajador->dependencia_clave  = (string) $trabajador->ur;
            }
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'rfc'   => $user->rfc,
                'nue'   => $user->nue,
                'email' => $user->email,
            ],
            'empleado' => $trabajador,
        ]);
    }

    /** PUT /api/perfil — actualizar nombre, RFC y correo */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'  => 'nullable|string|max:255',
            'rfc'   => ['nullable', 'string', 'max:20', Rule::unique('users', 'rfc')->ignore($user->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->fill(array_filter($data, fn ($v) => $v !== null));
        $user->save();

        return response()->json(['message' => 'Perfil actualizado correctamente.']);
    }

    /** PUT /api/perfil/password — cambiar contraseña */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(
                ['errors' => ['current_password' => ['La contraseña actual es incorrecta.']]],
                422
            );
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    /**
     * PUT /api/perfil/nue — vincular/actualizar el NUE del usuario.
     * Busca el NUE en la tabla delegacion para verificar que existe.
     */
    public function updateNue(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'nue' => 'required|string|max:15',
        ]);

        $nue = trim($request->nue);

        // Verificar que el NUE existe en la tabla de trabajadores
        $existe = DB::table('delegacion')->where('nue', $nue)->exists();
        if (! $existe) {
            return response()->json(
                ['errors' => ['nue' => ['Este NUE no se encontró en el padrón de trabajadores.']]],
                422
            );
        }

        $user->nue = $nue;
        $user->save();

        return response()->json(['message' => 'NUE actualizado correctamente.']);
    }
}
