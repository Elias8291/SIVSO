<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Redirige al usuario a cambiar contraseña si debe hacerlo.
     * No aplica a la ruta de cambiar contraseña ni al logout.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->must_change_password) {
            if (! $request->routeIs('cambiar-contrasena') && ! $request->routeIs('logout')) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Debe cambiar su contraseña antes de continuar.',
                        'must_change_password' => true,
                    ], 403);
                }

                return redirect()->route('cambiar-contrasena');
            }
        }

        return $next($request);
    }
}
