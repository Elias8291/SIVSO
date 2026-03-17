<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Muestra el login (SPA - React lo renderiza).
     */
    public function showLoginForm()
    {
        return view('spa');
    }

    /**
     * Procesa el login con RFC y contraseña.
     * Retorna JSON cuando la petición viene del SPA (Accept: application/json).
     */
    public function login(Request $request)
    {
        $request->validate([
            'rfc' => 'required|string|max:20',
            'password' => 'required|string',
        ], [
            'rfc.required' => 'El RFC es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
        ]);

        $credentials = [
            'rfc' => strtoupper($request->rfc),
            'password' => $request->password,
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $redirect = route('dashboard');

            if ($request->expectsJson()) {
                return response()->json(['redirect' => $redirect]);
            }

            return redirect()->intended($redirect);
        }

        $user = User::where('rfc', $credentials['rfc'])->first();
        $message = $user
            ? 'La contraseña es incorrecta.'
            : 'El RFC no está registrado en el sistema.';

        if ($request->expectsJson()) {
            return response()->json(['success' => false, 'message' => $message]);
        }

        throw ValidationException::withMessages(['rfc' => [$message]]);
    }

    /**
     * Muestra cambiar contraseña (SPA - React lo renderiza).
     */
    public function showCambiarContrasena()
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        return view('spa');
    }

    /**
     * Procesa el cambio de contraseña.
     * Retorna JSON cuando la petición viene del SPA.
     */
    public function cambiarContrasena(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $user = Auth::user();
        $user->password = Hash::make($request->password);
        $user->save();

        if ($request->expectsJson()) {
            return response()->json(['redirect' => route('dashboard')]);
        }

        return redirect()->route('dashboard')->with('success', 'Contraseña actualizada correctamente.');
    }

    /**
     * Cierra la sesión.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
