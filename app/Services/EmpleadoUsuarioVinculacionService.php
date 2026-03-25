<?php

namespace App\Services;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Evita violación UNIQUE en users.nue al asociar un colaborador: reutiliza fila existente por RFC o por NUE.
 */
final class EmpleadoUsuarioVinculacionService
{
    /**
     * @return array{user: User, reused: 'created'|'reused_rfc'|'reused_nue'}
     */
    public static function crearOReutilizarParaEmpleado(
        Empleado $e,
        string $rfcNorm,
        ?string $email,
        string $passwordPlain,
        string $name,
        bool $mustChangePassword,
    ): array {
        if ($e->user_id) {
            throw new \RuntimeException('empleado_ya_vinculado');
        }

        $nueTrim = trim((string) ($e->nue ?? ''));

        return DB::transaction(function () use ($e, $rfcNorm, $email, $passwordPlain, $name, $mustChangePassword, $nueTrim) {
            $emailNorm = $email !== null && trim((string) $email) !== '' ? trim((string) $email) : null;

            $byRfc = User::where('rfc', $rfcNorm)->lockForUpdate()->first();
            if ($byRfc) {
                $nueUser = trim((string) ($byRfc->nue ?? ''));
                if ($nueTrim !== '' && $nueUser !== '' && $nueUser !== $nueTrim) {
                    throw new \RuntimeException('rfc_nue_mismatch');
                }
                self::assertEmailUnique($emailNorm, $byRfc->id);
                Empleado::where('user_id', $byRfc->id)->where('id', '!=', $e->id)->update(['user_id' => null]);
                if ($nueTrim !== '' && $nueUser === '') {
                    $byRfc->nue = $nueTrim;
                }
                if ($emailNorm !== null) {
                    $byRfc->email = $emailNorm;
                }
                $byRfc->save();
                if (! $byRfc->hasRole('empleado')) {
                    $byRfc->assignRole('empleado');
                }
                $e->user_id = $byRfc->id;
                $e->save();

                return ['user' => $byRfc->fresh(), 'reused' => 'reused_rfc'];
            }

            if ($nueTrim !== '') {
                $byNue = User::where('nue', $nueTrim)->lockForUpdate()->first();
                if ($byNue) {
                    if (User::where('rfc', $rfcNorm)->where('id', '!=', $byNue->id)->exists()) {
                        throw new \RuntimeException('rfc_duplicado');
                    }
                    self::assertEmailUnique($emailNorm, $byNue->id);
                    Empleado::where('user_id', $byNue->id)->where('id', '!=', $e->id)->update(['user_id' => null]);
                    $byNue->name = $name;
                    $byNue->rfc = $rfcNorm;
                    if ($emailNorm !== null) {
                        $byNue->email = $emailNorm;
                    }
                    $byNue->password = $passwordPlain;
                    $byNue->must_change_password = $mustChangePassword;
                    $byNue->activo = true;
                    $byNue->save();
                    if (! $byNue->hasRole('empleado')) {
                        $byNue->assignRole('empleado');
                    }
                    $e->user_id = $byNue->id;
                    $e->save();

                    return ['user' => $byNue->fresh(), 'reused' => 'reused_nue'];
                }
            }

            self::assertEmailUnique($emailNorm, null);
            $user = User::create([
                'name' => $name,
                'rfc' => $rfcNorm,
                'email' => $emailNorm,
                'password' => $passwordPlain,
                'nue' => $nueTrim !== '' ? $nueTrim : null,
                'activo' => true,
                'must_change_password' => $mustChangePassword,
            ]);
            $user->assignRole('empleado');
            Empleado::where('user_id', $user->id)->where('id', '!=', $e->id)->update(['user_id' => null]);
            $e->user_id = $user->id;
            $e->save();

            return ['user' => $user, 'reused' => 'created'];
        });
    }

    private static function assertEmailUnique(?string $emailNorm, ?int $ignoreUserId): void
    {
        if ($emailNorm === null || $emailNorm === '') {
            return;
        }
        $q = User::where('email', $emailNorm);
        if ($ignoreUserId !== null) {
            $q->where('id', '!=', $ignoreUserId);
        }
        if ($q->exists()) {
            throw new \RuntimeException('email_duplicado');
        }
    }
}
