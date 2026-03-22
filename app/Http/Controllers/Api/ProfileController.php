<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $empleado = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])
            ->where('user_id', $user->id)
            ->first();

        $empleadoData = null;
        if ($empleado) {
            $empleadoData = [
                'id'                 => $empleado->id,
                'nue'                => $empleado->nue,
                'nombre_completo'    => $empleado->nombre_completo,
                'dependencia_clave'  => $empleado->dependencia?->clave,
                'dependencia_nombre' => $empleado->dependencia?->nombre,
                'delegacion_clave'   => $empleado->delegacion?->clave,
            ];
        }

        $delegadoData = null;
        $delegado = Delegado::where('user_id', $user->id)->first();
        if ($delegado) {
            $delegadoData = [
                'id'     => $delegado->id,
                'nombre' => $delegado->nombre,
            ];
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'rfc'   => $user->rfc,
                'nue'   => $user->nue,
                'email' => $user->email,
            ],
            'empleado' => $empleadoData,
            'delegado' => $delegadoData,
        ]);
    }

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

    public function updateNue(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate(['nue' => 'required|string|max:20']);

        $nue = trim($request->nue);

        $empleado = Empleado::where('nue', $nue)->first();
        if (! $empleado) {
            return response()->json(
                ['errors' => ['nue' => ['Este NUE no se encontró en el padrón de trabajadores.']]],
                422
            );
        }

        $user->nue = $nue;
        $user->save();

        if (! $empleado->user_id) {
            $empleado->user_id = $user->id;
            $empleado->save();
        }

        return response()->json(['message' => 'NUE actualizado correctamente.']);
    }

    public function updateDelegado(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'delegado_id' => 'nullable|integer|exists:delegados,id',
        ]);

        if ($request->delegado_id) {
            Delegado::where('user_id', $user->id)->update(['user_id' => null]);
            Delegado::where('id', $request->delegado_id)->update(['user_id' => $user->id]);
        } else {
            Delegado::where('user_id', $user->id)->update(['user_id' => null]);
        }

        return response()->json(['message' => 'Delegado actualizado correctamente.']);
    }
}
