<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\Seleccion;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VestuarioController extends Controller
{
    private function tieneEdicionCerrada(int $empleadoId, int $anio): bool
    {
        return DB::table('vestuario_ejercicio_cerrado')
            ->where('empleado_id', $empleadoId)
            ->where('anio', $anio)
            ->exists();
    }

    private function marcarEdicionCerrada(int $empleadoId, int $anio): void
    {
        $now = now();
        if ($this->tieneEdicionCerrada($empleadoId, $anio)) {
            DB::table('vestuario_ejercicio_cerrado')
                ->where('empleado_id', $empleadoId)
                ->where('anio', $anio)
                ->update(['updated_at' => $now]);

            return;
        }

        DB::table('vestuario_ejercicio_cerrado')->insert([
            'empleado_id' => $empleadoId,
            'anio' => $anio,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function liberarEdicionCerrada(int $empleadoId, int $anio): void
    {
        DB::table('vestuario_ejercicio_cerrado')
            ->where('empleado_id', $empleadoId)
            ->where('anio', $anio)
            ->delete();
    }

    /** Refleja el NUE en el perfil si ya hay vínculo por `empleados.user_id` o por `delegados.empleado_id`. */
    private function asegurarNueUsuarioDesdeEmpleadoSiFalta(User $user): void
    {
        if (trim((string) ($user->nue ?? '')) !== '') {
            return;
        }
        $emp = Empleado::where('user_id', $user->id)->first();
        if (! $emp) {
            $delegado = Delegado::where('user_id', $user->id)->whereNotNull('empleado_id')->first();
            if ($delegado) {
                $emp = Empleado::find($delegado->empleado_id);
            }
        }
        if ($emp && $emp->nue) {
            $user->nue = trim((string) $emp->nue);
            $user->save();
        }
    }

    private function delegacionIdsQueGestionaElUsuario(Request $request): Collection
    {
        $user = $request->user();
        if ($user instanceof User) {
            $this->asegurarNueUsuarioDesdeEmpleadoSiFalta($user);
        }
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

    private function usuarioPuedeReactivarVestuarioEmpleado(Request $request, int $empleadoId): bool
    {
        if ($request->user()->can('editar_empleados')) {
            return true;
        }

        return $this->delegadoPuedeGestionarEmpleadoId($request, $empleadoId);
    }

    /** Permite guardar en lote el vestuario de un colaborador (Mi delegación o permiso editar_seleccion). */
    private function usuarioPuedeGuardarLoteVestuarioEmpleado(Request $request, int $empleadoId): bool
    {
        if ($request->user()->can('editar_seleccion')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegadoPuedeGestionarEmpleadoId($request, $empleadoId);
    }

    private function verificarEmpleadoPuedeEditarSuVestuario(Empleado $empleado): ?JsonResponse
    {
        $v = $this->ejercicioVigenteAnio();
        if (! $this->tieneEdicionCerrada($empleado->id, $v)) {
            return null;
        }

        return response()->json([
            'message' => "Ya confirmaste tu vestuario para el ejercicio {$v}. Tu delegado puede reactivar la actualización si necesitas corregir algo.",
        ], 403);
    }

    /** Año del ejercicio en curso: periodo abierto, o año calendario si no hay periodo abierto. */
    private function ejercicioVigenteAnio(): int
    {
        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();

        return $periodo ? (int) $periodo->anio : (int) date('Y');
    }

    /**
     * Empleado del usuario: (1) NUE en perfil → padrón, (2) `empleados.user_id`, (3) delegado con `empleado_id`
     * (misma persona en catálogo de delegados sin NUE o sin fila user_id aún). Alinea NUE en perfil cuando aplique.
     */
    private function resolverEmpleadoDelUsuarioAutenticado(User $user): ?Empleado
    {
        $nueTrim = trim((string) ($user->nue ?? ''));
        if ($nueTrim !== '') {
            $porNue = Empleado::where('nue', $nueTrim)->first();
            if ($porNue) {
                return $porNue;
            }
        }

        $porUserId = Empleado::where('user_id', $user->id)->first();
        if ($porUserId) {
            if ($nueTrim === '' && $porUserId->nue) {
                $user->nue = trim((string) $porUserId->nue);
                $user->save();
            }

            return $porUserId;
        }

        $delegado = Delegado::where('user_id', $user->id)->whereNotNull('empleado_id')->first();
        if ($delegado) {
            $porDelegado = Empleado::find($delegado->empleado_id);
            if ($porDelegado && ($porDelegado->user_id === null || (int) $porDelegado->user_id === (int) $user->id)) {
                if ($porDelegado->user_id === null) {
                    Empleado::where('user_id', $user->id)->where('id', '!=', $porDelegado->id)->update(['user_id' => null]);
                    $porDelegado->user_id = $user->id;
                    $porDelegado->save();
                }
                if ($nueTrim === '' && $porDelegado->nue) {
                    $user->nue = trim((string) $porDelegado->nue);
                    $user->save();
                }

                return $porDelegado;
            }
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);

        if (! $empleado) {
            return response()->json([
                'empleado' => null,
                'asignaciones' => [],
                'anio' => (int) date('Y'),
                'anios_disponibles' => [],
                'ejercicio_vigente' => (int) date('Y'),
                'edicion_cerrada_ejercicio_vigente' => false,
                'puede_editar_vestuario' => false,
            ]);
        }

        $empleado->load(['dependencia:id,clave,nombre', 'delegacion:id,clave']);

        $aniosDisponibles = DB::table('selecciones')
            ->where('empleado_id', $empleado->id)
            ->distinct()
            ->pluck('anio')
            ->sort()
            ->values()
            ->toArray();

        $ejercicioVigente = $this->ejercicioVigenteAnio();
        $anio = $request->has('anio')
            ? (int) $request->get('anio')
            : $ejercicioVigente;

        $empleadoData = [
            'id' => $empleado->id,
            'nue' => $empleado->nue,
            'nombre' => $empleado->nombre_completo,
            'delegacion_clave' => $empleado->delegacion?->clave,
            'dependencia_clave' => $empleado->dependencia?->clave,
            'dependencia_nombre' => $empleado->dependencia?->nombre ?? '',
        ];

        $asignaciones = $this->getSelecciones($empleado->id, $anio);
        $vistaHeredaAnioAnterior = false;
        $anioReferenciaVista = null;

        if ($anio === $ejercicioVigente && $asignaciones->isEmpty()) {
            $prevYears = array_values(array_filter($aniosDisponibles, fn ($y) => (int) $y < $ejercicioVigente));
            if (count($prevYears) > 0) {
                $anioReferenciaVista = max($prevYears);
                $asignaciones = $this->getSelecciones($empleado->id, $anioReferenciaVista)
                    ->map(fn (array $row) => array_merge($row, ['heredado_preview' => true]));
                $vistaHeredaAnioAnterior = true;
            }
        }

        $periodoActivo = Periodo::where('estado', 'abierto')
            ->orderByDesc('anio')
            ->first();

        $edicionCerrada = $this->tieneEdicionCerrada($empleado->id, $ejercicioVigente);
        $puedeEditarVestuario = $periodoActivo !== null
            && $anio === $ejercicioVigente
            && ! $edicionCerrada;

        return response()->json([
            'empleado' => $empleadoData,
            'asignaciones' => $asignaciones,
            'anio' => $anio,
            'ejercicio_vigente' => $ejercicioVigente,
            'anios_disponibles' => $aniosDisponibles,
            'vista_hereda_anio_anterior' => $vistaHeredaAnioAnterior,
            'anio_referencia_vista' => $anioReferenciaVista,
            'edicion_cerrada_ejercicio_vigente' => $edicionCerrada,
            'puede_editar_vestuario' => $puedeEditarVestuario,
            'partidas_catalogo' => $anio === $ejercicioVigente
                ? $this->partidasCatalogoConPrecio($ejercicioVigente)
                : [],
            'periodo_activo' => $periodoActivo ? [
                'id' => $periodoActivo->id,
                'anio' => (int) $periodoActivo->anio,
                'nombre' => $periodoActivo->nombre,
                'fecha_fin' => $periodoActivo->fecha_fin ? $periodoActivo->fecha_fin->format('Y-m-d') : null,
            ] : null,
        ]);
    }

    private function verificarPeriodoActivoParaEdicion(): ?JsonResponse
    {
        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();

        if (! $periodo) {
            return response()->json(['message' => 'No hay un periodo de actualización activo. No se pueden hacer cambios.'], 403);
        }

        return null;
    }

    private function verificarSeleccionEsEjercicioVigente(Seleccion $seleccion): ?JsonResponse
    {
        $v = $this->ejercicioVigenteAnio();
        if ((int) $seleccion->anio !== $v) {
            return response()->json(['message' => "Solo puede actualizar el vestuario del ejercicio vigente ({$v})."], 403);
        }

        return null;
    }

    /**
     * Si la selección es de un año anterior, crea (o reutiliza) la fila equivalente en el ejercicio vigente.
     */
    private function materializarSeleccionAlAnioCalendario(Seleccion $seleccion, int $empleadoId): Seleccion
    {
        $anioDestino = $this->ejercicioVigenteAnio();
        $seleccion->loadMissing('productoTalla');
        if ((int) $seleccion->empleado_id !== $empleadoId) {
            return $seleccion;
        }
        if ((int) $seleccion->anio === $anioDestino) {
            return $seleccion;
        }

        $ptOld = $seleccion->productoTalla;
        if (! $ptOld) {
            return $seleccion;
        }

        $ptRow = DB::table('producto_tallas')
            ->where('producto_id', $ptOld->producto_id)
            ->where('talla_id', $ptOld->talla_id)
            ->where('anio', $anioDestino)
            ->first();

        if (! $ptRow) {
            $ptNewId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $ptOld->producto_id,
                'talla_id' => $ptOld->talla_id,
                'anio' => $anioDestino,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ptNewId = $ptRow->id;
        }

        $existing = Seleccion::where('empleado_id', $empleadoId)
            ->where('anio', $anioDestino)
            ->where('producto_talla_id', $ptNewId)
            ->first();

        if ($existing) {
            return $existing->load('productoTalla');
        }

        $nueva = Seleccion::create([
            'empleado_id' => $empleadoId,
            'producto_talla_id' => $ptNewId,
            'anio' => $anioDestino,
            'cantidad' => $seleccion->cantidad,
        ]);

        return $nueva->load('productoTalla');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function jsonActualizacionSeleccion(string $message, Seleccion $seleccion, int $origId, array $extra = []): JsonResponse
    {
        $payload = array_merge([
            'message' => $message,
            'seleccion_id' => $seleccion->id,
            'ejercicio' => (int) $seleccion->anio,
        ], $extra);

        if ($origId !== (int) $seleccion->id) {
            $payload['remapped_from'] = $origId;
        }

        return response()->json($payload);
    }

    private function abortJson(int $status, string $message): void
    {
        throw new HttpResponseException(response()->json(['message' => $message], $status));
    }

    private function asegurarSeleccionEjercicioVigente(Seleccion $seleccion): void
    {
        $v = $this->ejercicioVigenteAnio();
        if ((int) $seleccion->anio !== $v) {
            $this->abortJson(403, "Solo puede actualizar el vestuario del ejercicio vigente ({$v}).");
        }
    }

    private function aplicarTallaSeleccionMiVestuario(Seleccion $seleccion, string $talla): void
    {
        $seleccion->loadMissing('productoTalla');
        if (! $seleccion->productoTalla) {
            $this->abortJson(422, 'Selección sin talla de catálogo asociada.');
        }

        $nombre = strtoupper(trim($talla));
        $row = DB::table('tallas')->where('nombre', $nombre)->first();
        $tallaId = $row ? $row->id : DB::table('tallas')->insertGetId([
            'nombre' => $nombre, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $newPt = DB::table('producto_tallas')
            ->where('producto_id', $seleccion->productoTalla->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $newPt) {
            $newPtId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $seleccion->productoTalla->producto_id,
                'talla_id' => $tallaId,
                'anio' => $seleccion->anio,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $newPtId = $newPt->id;
        }

        $seleccion->update(['producto_talla_id' => $newPtId]);
    }

    private function aplicarProductoSeleccionMiVestuario(Seleccion $seleccion, int $productoId, ?string $tallaStr): void
    {
        $seleccion->loadMissing('productoTalla');
        if (! $seleccion->productoTalla) {
            $this->abortJson(422, 'Selección sin producto asociado.');
        }

        $tallaId = $seleccion->productoTalla->talla_id;
        if ($tallaStr !== null && trim($tallaStr) !== '') {
            $nombre = strtoupper(trim($tallaStr));
            $talla = DB::table('tallas')->where('nombre', $nombre)->first();
            $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
                'nombre' => $nombre, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $pt = DB::table('producto_tallas')
            ->where('producto_id', $productoId)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $pt) {
            $ptId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $productoId,
                'talla_id' => $tallaId,
                'anio' => $seleccion->anio,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ptId = $pt->id;
        }

        $seleccion->update(['producto_talla_id' => $ptId]);
    }

    private function aplicarCantidadSeleccionMiVestuario(Seleccion $seleccion, int $cantidad): void
    {
        $seleccion->update(['cantidad' => $cantidad]);
    }

    /** Partidas (número) que tienen al menos un producto con precio en el ejercicio (catálogo para agregar líneas). */
    private function partidasCatalogoConPrecio(int $anio): array
    {
        return DB::table('productos AS p')
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->join('producto_precios AS pp', function ($j) use ($anio) {
                $j->on('pp.producto_id', '=', 'p.id')->where('pp.anio', '=', $anio);
            })
            ->distinct()
            ->orderBy('pa.numero')
            ->pluck('pa.numero')
            ->map(fn ($n) => (int) $n)
            ->values()
            ->all();
    }

    /** Suma cantidad × precio_unitario del vestuario del empleado en un año (selecciones reales en BD). */
    private function totalImporteVestuarioEmpleadoAnio(int $empleadoId, int $anio): float
    {
        $raw = DB::table('selecciones AS s')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->where('s.empleado_id', $empleadoId)
            ->where('s.anio', $anio)
            ->selectRaw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0)) AS t')
            ->value('t');

        return round((float) $raw, 2);
    }

    private function crearSeleccionNuevaLineaVestuario(int $empleadoId, int $productoId, string $tallaNombre, int $cantidad): void
    {
        $anio = $this->ejercicioVigenteAnio();
        if ($cantidad < 1 || $cantidad > 100) {
            $this->abortJson(422, 'Cantidad inválida para el artículo nuevo.');
        }

        $nombre = strtoupper(trim($tallaNombre));
        if ($nombre === '') {
            $this->abortJson(422, 'La talla es obligatoria al agregar un artículo nuevo.');
        }

        $row = DB::table('tallas')->where('nombre', $nombre)->first();
        $tallaId = $row ? (int) $row->id : (int) DB::table('tallas')->insertGetId([
            'nombre' => $nombre, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $pt = DB::table('producto_tallas')
            ->where('producto_id', $productoId)
            ->where('talla_id', $tallaId)
            ->where('anio', $anio)
            ->first();

        if (! $pt) {
            $ptId = (int) DB::table('producto_tallas')->insertGetId([
                'producto_id' => $productoId,
                'talla_id' => $tallaId,
                'anio' => $anio,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ptId = (int) $pt->id;
        }

        $dup = Seleccion::where('empleado_id', $empleadoId)
            ->where('anio', $anio)
            ->where('producto_talla_id', $ptId)
            ->exists();

        if ($dup) {
            $this->abortJson(422, 'Ya existe una línea con ese artículo y talla. Use la tarjeta existente para cambiar cantidad o elija otro producto.');
        }

        Seleccion::create([
            'empleado_id' => $empleadoId,
            'producto_talla_id' => $ptId,
            'anio' => $anio,
            'cantidad' => $cantidad,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $cambios
     */
    private function validarPayloadCambiosVestuario(array $cambios): ?JsonResponse
    {
        foreach ($cambios as $i => $c) {
            $tipo = $c['tipo'] ?? '';
            if (! in_array($tipo, ['producto', 'talla', 'cantidad', 'nueva_linea'], true)) {
                return response()->json(['message' => 'Cambio #'.($i + 1).': tipo no válido.'], 422);
            }
            if ($tipo === 'nueva_linea') {
                if (empty($c['producto_id'])) {
                    return response()->json(['message' => 'Cambio #'.($i + 1).': producto_id requerido.'], 422);
                }
                if (trim((string) ($c['talla'] ?? '')) === '') {
                    return response()->json(['message' => 'Cambio #'.($i + 1).': talla requerida.'], 422);
                }
                $q = (int) ($c['cantidad'] ?? 0);
                if ($q < 1 || $q > 100) {
                    return response()->json(['message' => 'Cambio #'.($i + 1).': cantidad inválida.'], 422);
                }

                continue;
            }
            if (empty($c['seleccion_id'])) {
                return response()->json(['message' => 'Cambio #'.($i + 1).': seleccion_id requerido.'], 422);
            }
            if ($tipo === 'talla' && trim((string) ($c['talla'] ?? '')) === '') {
                return response()->json(['message' => 'Cambio #'.($i + 1).': talla requerida.'], 422);
            }
            if ($tipo === 'producto' && empty($c['producto_id'])) {
                return response()->json(['message' => 'Cambio #'.($i + 1).': producto_id requerido.'], 422);
            }
            if ($tipo === 'cantidad') {
                $q = (int) ($c['cantidad'] ?? 0);
                if ($q < 1 || $q > 100) {
                    return response()->json(['message' => 'Cambio #'.($i + 1).': cantidad inválida.'], 422);
                }
            }
        }

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $cambios
     */
    private function aplicarLoteCambiosVestuarioEnTransaccion(array $cambios, int $empleadoId): void
    {
        $anioV = $this->ejercicioVigenteAnio();
        $topeImporte = $this->totalImporteVestuarioEmpleadoAnio($empleadoId, $anioV);

        $resolved = [];

        foreach ($cambios as $c) {
            $tipo = $c['tipo'] ?? '';

            if ($tipo === 'nueva_linea') {
                $this->crearSeleccionNuevaLineaVestuario(
                    $empleadoId,
                    (int) $c['producto_id'],
                    (string) $c['talla'],
                    (int) $c['cantidad']
                );

                continue;
            }

            $clientId = (int) $c['seleccion_id'];
            $currentId = $resolved[$clientId] ?? $clientId;

            $seleccion = Seleccion::with('productoTalla')
                ->where('id', $currentId)
                ->where('empleado_id', $empleadoId)
                ->first();

            if (! $seleccion) {
                $this->abortJson(404, 'Registro de vestuario no encontrado.');
            }

            $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleadoId);
            $resolved[$clientId] = (int) $seleccion->id;

            $this->asegurarSeleccionEjercicioVigente($seleccion);

            match ($tipo) {
                'talla' => $this->aplicarTallaSeleccionMiVestuario($seleccion, (string) $c['talla']),
                'producto' => $this->aplicarProductoSeleccionMiVestuario(
                    $seleccion,
                    (int) $c['producto_id'],
                    isset($c['talla']) ? (string) $c['talla'] : null
                ),
                'cantidad' => $this->aplicarCantidadSeleccionMiVestuario($seleccion, (int) $c['cantidad']),
                default => $this->abortJson(422, 'Tipo de cambio no válido.'),
            };
        }

        if ($topeImporte > 0.01) {
            $final = $this->totalImporteVestuarioEmpleadoAnio($empleadoId, $anioV);
            if ($final > $topeImporte + 0.05) {
                $this->abortJson(422, 'El importe total del vestuario supera su asignación inicial. Reduzca cantidades, elija artículos más económicos o quite líneas agregadas.');
            }
        }
    }

    /** Total gastado en vestuario (precio catálogo × cantidad) para una UR y un ejercicio. */
    private function totalGastoDependenciaAnio(?int $dependenciaId, int $anio): array
    {
        if (! $dependenciaId) {
            return ['total' => 0.0, 'total_iva' => 0.0];
        }

        $raw = DB::table('selecciones AS s')
            ->join('empleados AS e', 'e.id', '=', 's.empleado_id')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->where('e.dependencia_id', $dependenciaId)
            ->where('s.anio', $anio)
            ->selectRaw('SUM(s.cantidad * COALESCE(pp.precio_unitario, 0)) AS t')
            ->value('t');

        $total = round((float) $raw, 2);

        return [
            'total' => $total,
            'total_iva' => round($total * 1.16, 2),
        ];
    }

    public function updateTalla(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);
        if (! $empleado) {
            return response()->json(['message' => 'Sin empleado vinculado. Vincula tu NUE en Mi cuenta o revisa tu registro en el padrón.'], 403);
        }

        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado->id)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($blocked = $this->verificarEmpleadoPuedeEditarSuVestuario($empleado)) {
            return $blocked;
        }

        $origId = (int) $seleccion->id;
        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado->id);

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }
        if ($blocked = $this->verificarSeleccionEsEjercicioVigente($seleccion)) {
            return $blocked;
        }

        $request->validate(['talla' => 'required|string|max:30']);

        $this->aplicarTallaSeleccionMiVestuario($seleccion, $request->talla);
        $seleccion->refresh();

        $this->marcarEdicionCerrada($empleado->id, (int) $seleccion->anio);

        return $this->jsonActualizacionSeleccion('Talla actualizada correctamente.', $seleccion, $origId);
    }

    public function updateProducto(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);
        if (! $empleado) {
            return response()->json(['message' => 'Sin empleado vinculado. Vincula tu NUE en Mi cuenta o revisa tu registro en el padrón.'], 403);
        }

        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado->id)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($blocked = $this->verificarEmpleadoPuedeEditarSuVestuario($empleado)) {
            return $blocked;
        }

        $origId = (int) $seleccion->id;
        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado->id);

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }
        if ($blocked = $this->verificarSeleccionEsEjercicioVigente($seleccion)) {
            return $blocked;
        }

        $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'talla' => 'nullable|string|max:30',
        ]);

        $this->aplicarProductoSeleccionMiVestuario($seleccion, (int) $request->producto_id, $request->talla);
        $seleccion->refresh();

        $this->marcarEdicionCerrada($empleado->id, (int) $seleccion->anio);

        return $this->jsonActualizacionSeleccion('Artículo actualizado correctamente.', $seleccion, $origId);
    }

    public function updateCantidad(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);
        if (! $empleado) {
            return response()->json(['message' => 'Sin empleado vinculado. Vincula tu NUE en Mi cuenta o revisa tu registro en el padrón.'], 403);
        }

        $seleccion = Seleccion::where('id', $id)->where('empleado_id', $empleado->id)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        if ($blocked = $this->verificarEmpleadoPuedeEditarSuVestuario($empleado)) {
            return $blocked;
        }

        $origId = (int) $seleccion->id;
        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado->id);

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }
        if ($blocked = $this->verificarSeleccionEsEjercicioVigente($seleccion)) {
            return $blocked;
        }

        $request->validate(['cantidad' => 'required|integer|min:1|max:100']);

        $this->aplicarCantidadSeleccionMiVestuario($seleccion, (int) $request->cantidad);
        $seleccion->refresh();

        $this->marcarEdicionCerrada($empleado->id, (int) $seleccion->anio);

        return $this->jsonActualizacionSeleccion('Cantidad actualizada correctamente.', $seleccion, $origId);
    }

    public function guardarCambiosMiVestuario(Request $request): JsonResponse
    {
        $user = $request->user();
        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);
        if (! $empleado) {
            return response()->json(['message' => 'Sin empleado vinculado. Vincula tu NUE en Mi cuenta o revisa tu registro en el padrón.'], 403);
        }

        if ($blocked = $this->verificarEmpleadoPuedeEditarSuVestuario($empleado)) {
            return $blocked;
        }

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }

        $request->validate([
            'cambios' => 'required|array|min:1|max:60',
        ]);

        $cambios = $request->input('cambios');
        if ($err = $this->validarPayloadCambiosVestuario($cambios)) {
            return $err;
        }

        try {
            DB::transaction(function () use ($cambios, $empleado) {
                $this->aplicarLoteCambiosVestuarioEnTransaccion($cambios, $empleado->id);
                $this->marcarEdicionCerrada($empleado->id, $this->ejercicioVigenteAnio());
            });
        } catch (HttpResponseException $e) {
            return $e->getResponse();
        }

        return response()->json([
            'message' => 'Cambios guardados. Ya no podrás editar tu vestuario del ejercicio actual salvo que tu delegado reactive la actualización.',
        ]);
    }

    public function empleadoReactivarEdicionVestuario(Request $request, int $empleado): JsonResponse
    {
        if (! $this->usuarioPuedeReactivarVestuarioEmpleado($request, $empleado)) {
            return response()->json(['message' => 'No tiene permiso para gestionar el vestuario de este empleado.'], 403);
        }

        $data = $request->validate([
            'anio' => 'nullable|integer|min:2000|max:2100',
        ]);

        $anio = isset($data['anio']) ? (int) $data['anio'] : $this->ejercicioVigenteAnio();

        $this->liberarEdicionCerrada($empleado, $anio);

        return response()->json([
            'message' => 'Actualización de vestuario reactivada: el empleado podrá modificar de nuevo su vestuario para ese ejercicio.',
            'anio' => $anio,
        ]);
    }

    public function empleadoVestuario(Request $request, int $empleado): JsonResponse
    {
        $user = $request->user();
        $comoDelegado = $user->can('ver_mi_delegacion') && $this->delegadoPuedeGestionarEmpleadoId($request, $empleado);
        $desdeModuloEmpleados = $user->can('ver_empleados') && $user->can('ver_productos_empleado');
        if (! $comoDelegado && ! $desdeModuloEmpleados) {
            return response()->json(['message' => 'No tiene permiso para ver el vestuario de este colaborador.'], 403);
        }

        $emp = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])->find($empleado);
        if (! $emp) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        $aniosDisponibles = DB::table('selecciones')
            ->where('empleado_id', $emp->id)
            ->distinct()
            ->pluck('anio')
            ->sort()
            ->values()
            ->toArray();

        $anioCalendario = $this->ejercicioVigenteAnio();
        $anio = $request->has('anio')
            ? (int) $request->get('anio')
            : $anioCalendario;

        $empleadoData = [
            'nue' => $emp->nue,
            'nombre' => $emp->nombre_completo,
            'delegacion_clave' => $emp->delegacion?->clave,
            'dependencia_clave' => $emp->dependencia?->clave,
            'dependencia_nombre' => $emp->dependencia?->nombre ?? '',
        ];

        $anioReferenciaVista = null;
        $vistaHeredaAnioAnterior = false;
        $estadoActualizacionEjercicio = 'actualizado';
        $asignaciones = collect();

        if ($anio !== $anioCalendario) {
            $asignaciones = $this->getSelecciones($emp->id, $anio);
            $estadoActualizacionEjercicio = $asignaciones->isEmpty() ? 'sin_historial' : 'historico';
        } else {
            $prevYears = array_values(array_filter($aniosDisponibles, fn ($y) => (int) $y < $anioCalendario));
            $anioRef = count($prevYears) > 0 ? max($prevYears) : null;
            $vigente = $this->getSelecciones($emp->id, $anioCalendario);

            if ($vigente->isEmpty()) {
                if ($anioRef !== null) {
                    $anioReferenciaVista = $anioRef;
                    $asignaciones = $this->getSelecciones($emp->id, $anioRef)
                        ->map(fn (array $row) => array_merge($row, ['heredado_preview' => true]));
                    $vistaHeredaAnioAnterior = true;
                    $estadoActualizacionEjercicio = 'pendiente_actualizar';
                } else {
                    $estadoActualizacionEjercicio = 'sin_historial';
                }
            } elseif ($anioRef !== null) {
                $prevRows = $this->getSelecciones($emp->id, $anioRef);
                $lineaKey = static fn (array $r): string => (string) $r['partida'].'|'.(string) $r['producto_id'];
                $keysVigente = $vigente->map($lineaKey)->flip()->all();

                $extras = $prevRows
                    ->filter(fn (array $row) => ! isset($keysVigente[$lineaKey($row)]))
                    ->map(fn (array $row) => array_merge($row, ['heredado_preview' => true]))
                    ->values();

                if ($extras->isNotEmpty()) {
                    $asignaciones = $vigente
                        ->concat($extras)
                        ->sortBy(fn (array $r) => sprintf('%06d-%s', (int) $r['partida'], (string) $r['descripcion']))
                        ->values();
                    $anioReferenciaVista = $anioRef;
                    $vistaHeredaAnioAnterior = true;
                    $estadoActualizacionEjercicio = 'pendiente_actualizar';
                } else {
                    $asignaciones = $vigente;
                    $estadoActualizacionEjercicio = 'actualizado';
                }
            } else {
                $asignaciones = $vigente;
                $estadoActualizacionEjercicio = 'actualizado';
            }
        }

        $depId = $emp->dependencia_id;
        $prevYearsAll = array_values(array_filter($aniosDisponibles, fn ($y) => (int) $y < $anioCalendario));
        $anioPresupuestoAnterior = count($prevYearsAll) ? max($prevYearsAll) : null;

        $presupuestoComparativo = [
            'ur' => [
                'ejercicio_actual' => array_merge(
                    ['anio' => $anioCalendario],
                    $this->totalGastoDependenciaAnio($depId, $anioCalendario)
                ),
                'ejercicio_anterior' => $anioPresupuestoAnterior !== null
                    ? array_merge(
                        ['anio' => $anioPresupuestoAnterior],
                        $this->totalGastoDependenciaAnio($depId, $anioPresupuestoAnterior)
                    )
                    : null,
            ],
            'filas_en_pantalla' => [
                'importe_estimado' => round(
                    (float) $asignaciones->sum(fn ($r) => (float) ($r['importe'] ?? 0)),
                    2
                ),
                'anio_precios_aplicados' => $vistaHeredaAnioAnterior ? $anioReferenciaVista : $anio,
            ],
        ];

        $edicionCerradaEmp = $this->tieneEdicionCerrada($emp->id, $anioCalendario);

        $periodoActivo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();
        $puedeEditarVestuario = $periodoActivo !== null
            && $anio === $anioCalendario
            && $this->usuarioPuedeGuardarLoteVestuarioEmpleado($request, $emp->id);

        return response()->json([
            'empleado' => $empleadoData,
            'asignaciones' => $asignaciones,
            'anio' => $anio,
            'anios_disponibles' => $aniosDisponibles,
            'anio_calendario' => $anioCalendario,
            'ejercicio_vigente' => $anioCalendario,
            'edicion_cerrada_ejercicio_vigente' => $edicionCerradaEmp,
            'vista_hereda_anio_anterior' => $vistaHeredaAnioAnterior,
            'anio_referencia_vista' => $anioReferenciaVista,
            'estado_actualizacion_ejercicio' => $estadoActualizacionEjercicio,
            'presupuesto_comparativo' => $presupuestoComparativo,
            'partidas_catalogo' => $anio === $anioCalendario
                ? $this->partidasCatalogoConPrecio($anioCalendario)
                : [],
            'periodo_activo' => $periodoActivo ? [
                'id' => $periodoActivo->id,
                'anio' => (int) $periodoActivo->anio,
                'nombre' => $periodoActivo->nombre,
                'fecha_fin' => $periodoActivo->fecha_fin ? $periodoActivo->fecha_fin->format('Y-m-d') : null,
            ] : null,
            'puede_editar_vestuario' => $puedeEditarVestuario,
            'puede_reactivar_vestuario_empleado' => $this->usuarioPuedeReactivarVestuarioEmpleado($request, $emp->id),
        ]);
    }

    public function empleadoGuardarCambiosVestuario(Request $request, int $empleado): JsonResponse
    {
        if (! $this->usuarioPuedeGuardarLoteVestuarioEmpleado($request, $empleado)) {
            return response()->json(['message' => 'No tiene permiso para guardar el vestuario de este colaborador.'], 403);
        }

        $emp = Empleado::find($empleado);
        if (! $emp) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }

        $request->validate([
            'cambios' => 'required|array|min:1|max:60',
        ]);

        $cambios = $request->input('cambios');
        if ($err = $this->validarPayloadCambiosVestuario($cambios)) {
            return $err;
        }

        try {
            DB::transaction(function () use ($cambios, $emp) {
                $this->aplicarLoteCambiosVestuarioEnTransaccion($cambios, $emp->id);
                $this->marcarEdicionCerrada($emp->id, $this->ejercicioVigenteAnio());
            });
        } catch (HttpResponseException $e) {
            return $e->getResponse();
        }

        return response()->json([
            'message' => 'Cambios guardados. El colaborador no podrá editar su vestuario del ejercicio vigente en Mi vestuario hasta que reactive la actualización desde aquí.',
        ]);
    }

    public function empleadoUpdateTalla(Request $request, int $empleado, int $id): JsonResponse
    {
        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado);

        $request->validate(['talla' => 'required|string|max:30']);

        $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
        $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
            'nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now(),
        ]);

        $newPt = DB::table('producto_tallas')
            ->where('producto_id', $seleccion->productoTalla->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $newPt) {
            $newPt = (object) ['id' => DB::table('producto_tallas')->insertGetId([
                'producto_id' => $seleccion->productoTalla->producto_id,
                'talla_id' => $tallaId,
                'anio' => $seleccion->anio,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ])];
        }

        $seleccion->update(['producto_talla_id' => $newPt->id]);

        return response()->json(['message' => 'Talla actualizada correctamente.']);
    }

    public function empleadoUpdateProducto(Request $request, int $empleado, int $id): JsonResponse
    {
        $seleccion = Seleccion::with('productoTalla')->where('id', $id)->where('empleado_id', $empleado)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado);

        $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'talla' => 'nullable|string|max:30',
        ]);

        $tallaId = $seleccion->productoTalla->talla_id;
        if ($request->talla) {
            $talla = DB::table('tallas')->where('nombre', strtoupper(trim($request->talla)))->first();
            $tallaId = $talla ? $talla->id : DB::table('tallas')->insertGetId([
                'nombre' => strtoupper(trim($request->talla)), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $pt = DB::table('producto_tallas')
            ->where('producto_id', $request->producto_id)
            ->where('talla_id', $tallaId)
            ->where('anio', $seleccion->anio)
            ->first();

        if (! $pt) {
            $ptId = DB::table('producto_tallas')->insertGetId([
                'producto_id' => $request->producto_id,
                'talla_id' => $tallaId,
                'anio' => $seleccion->anio,
                'medidas' => null,
                'cantidad_disponible' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $ptId = $pt->id;
        }

        $seleccion->update(['producto_talla_id' => $ptId]);

        return response()->json(['message' => 'Artículo actualizado correctamente.']);
    }

    public function empleadoUpdateCantidad(Request $request, int $empleado, int $id): JsonResponse
    {
        $seleccion = Seleccion::where('id', $id)->where('empleado_id', $empleado)->first();
        if (! $seleccion) {
            return response()->json(['message' => 'Registro no encontrado.'], 404);
        }

        $origId = (int) $seleccion->id;
        $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado);

        $request->validate(['cantidad' => 'required|integer|min:1|max:100']);

        $seleccion->update(['cantidad' => $request->cantidad]);

        return $this->jsonActualizacionSeleccion('Cantidad actualizada correctamente.', $seleccion, $origId);
    }

    private function getSelecciones(int $empleadoId, int $anio): Collection
    {
        return DB::table('selecciones AS s')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->where('s.empleado_id', $empleadoId)
            ->where('s.anio', $anio)
            ->select([
                's.id', 's.cantidad', 's.anio',
                'p.id AS producto_id', 'p.descripcion', 'p.marca', 'p.unidad', 'p.medida',
                'pp.clave AS codigo', 'pp.precio_unitario',
                't.nombre AS talla', 't.id AS talla_id',
                'pa.numero AS partida',
            ])
            ->orderBy('pa.numero')
            ->orderBy('p.descripcion')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'producto_id' => $c->producto_id,
                'anio' => (int) $c->anio,
                'cantidad' => (int) $c->cantidad,
                'talla' => $c->talla,
                'talla_id' => $c->talla_id,
                'clave_vestuario' => $c->codigo,
                'codigo' => $c->codigo,
                'precio_unitario' => $c->precio_unitario,
                'importe' => $c->precio_unitario ? round($c->cantidad * $c->precio_unitario, 2) : null,
                'descripcion' => $c->descripcion,
                'marca' => $c->marca,
                'unidad' => $c->unidad,
                'medida' => $c->medida,
                'partida' => $c->partida,
            ]);
    }
}
