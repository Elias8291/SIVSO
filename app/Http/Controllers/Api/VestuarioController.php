<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\Seleccion;
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

    private function usuarioPuedeReactivarVestuarioEmpleado(Request $request, int $empleadoId): bool
    {
        if ($request->user()->can('editar_empleados')) {
            return true;
        }

        return $this->delegadoPuedeGestionarEmpleadoId($request, $empleadoId);
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

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->nue) {
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

        $empleado = Empleado::with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])
            ->where('nue', $user->nue)
            ->first();

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
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
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
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
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
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
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
        if (! $user->nue) {
            return response()->json(['message' => 'Sin NUE vinculado.'], 403);
        }

        $empleado = Empleado::where('nue', $user->nue)->first();
        if (! $empleado) {
            return response()->json(['message' => 'Empleado no encontrado.'], 404);
        }

        if ($blocked = $this->verificarEmpleadoPuedeEditarSuVestuario($empleado)) {
            return $blocked;
        }

        if ($blocked = $this->verificarPeriodoActivoParaEdicion()) {
            return $blocked;
        }

        $request->validate([
            'cambios' => 'required|array|min:1|max:40',
            'cambios.*.seleccion_id' => 'required|integer|min:1',
            'cambios.*.tipo' => 'required|string|in:producto,talla,cantidad',
        ]);

        foreach ($request->input('cambios') as $i => $c) {
            $tipo = $c['tipo'];
            if ($tipo === 'talla' && empty($c['talla'])) {
                return response()->json(['message' => "Cambio #{$i}: talla requerida."], 422);
            }
            if ($tipo === 'producto') {
                if (empty($c['producto_id'])) {
                    return response()->json(['message' => "Cambio #{$i}: producto_id requerido."], 422);
                }
            }
            if ($tipo === 'cantidad') {
                $q = (int) ($c['cantidad'] ?? 0);
                if ($q < 1 || $q > 100) {
                    return response()->json(['message' => "Cambio #{$i}: cantidad inválida."], 422);
                }
            }
        }

        try {
            DB::transaction(function () use ($request, $empleado) {
                $resolved = [];
                foreach ($request->input('cambios') as $c) {
                    $clientId = (int) $c['seleccion_id'];
                    $currentId = $resolved[$clientId] ?? $clientId;

                    $seleccion = Seleccion::with('productoTalla')
                        ->where('id', $currentId)
                        ->where('empleado_id', $empleado->id)
                        ->first();

                    if (! $seleccion) {
                        $this->abortJson(404, 'Registro de vestuario no encontrado.');
                    }

                    $seleccion = $this->materializarSeleccionAlAnioCalendario($seleccion, $empleado->id);
                    $resolved[$clientId] = (int) $seleccion->id;

                    $this->asegurarSeleccionEjercicioVigente($seleccion);

                    match ($c['tipo']) {
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
        $asignaciones = $this->getSelecciones($emp->id, $anio);

        $anioReferenciaVista = null;
        $vistaHeredaAnioAnterior = false;
        $estadoActualizacionEjercicio = 'actualizado';

        if ($anio === $anioCalendario && $asignaciones->isEmpty()) {
            $prevYears = array_values(array_filter($aniosDisponibles, fn ($y) => (int) $y < $anioCalendario));
            if (count($prevYears) > 0) {
                $anioReferenciaVista = max($prevYears);
                $asignaciones = $this->getSelecciones($emp->id, $anioReferenciaVista)
                    ->map(fn (array $row) => array_merge($row, ['heredado_preview' => true]));
                $vistaHeredaAnioAnterior = true;
                $estadoActualizacionEjercicio = 'pendiente_actualizar';
            } else {
                $estadoActualizacionEjercicio = 'sin_historial';
            }
        } elseif ($anio !== $anioCalendario) {
            $estadoActualizacionEjercicio = $asignaciones->isEmpty() ? 'sin_historial' : 'historico';
        } elseif ($anio === $anioCalendario && $asignaciones->isNotEmpty()) {
            $estadoActualizacionEjercicio = 'actualizado';
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
