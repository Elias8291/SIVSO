<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\Periodo;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class AcuseVestuarioPdfController extends Controller
{
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

    private function delegadoPuedeGestionarEmpleadoId(Request $request, int $empleadoId): bool
    {
        $emp = Empleado::find($empleadoId);
        if (! $emp || ! $emp->delegacion_id) {
            return false;
        }

        return $this->delegacionIdsQueGestionaElUsuario($request)->contains($emp->delegacion_id);
    }

    private function usuarioPuedeVerAcuseEmpleado(Request $request, int $empleadoId): bool
    {
        if ($request->user()->can('ver_empleados')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegadoPuedeGestionarEmpleadoId($request, $empleadoId);
    }

    private function usuarioPuedeExportarDelegacion(Request $request, int $delegacionId): bool
    {
        if ($request->user()->can('ver_empleados')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegacionIdsQueGestionaElUsuario($request)->contains($delegacionId);
    }

    private function ejercicioVigenteAnio(): int
    {
        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();

        return $periodo ? (int) $periodo->anio : (int) date('Y');
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
                'codigo' => $c->codigo,
                'descripcion' => $c->descripcion,
                'marca' => $c->marca,
                'unidad' => $c->unidad,
                'medida' => $c->medida,
                'partida' => $c->partida,
            ]);
    }

    /**
     * Líneas del acuse: ejercicio solicitado o vigente; si no hay filas, último año con selecciones.
     *
     * @return array{lineas: Collection<int, array<string, mixed>>, anio_datos: int}
     */
    private function lineasAcuseParaEmpleado(Empleado $emp, ?int $anioSolicitado): array
    {
        $anioVigente = $this->ejercicioVigenteAnio();
        $anio = $anioSolicitado ?? $anioVigente;
        $lineas = $this->getSelecciones($emp->id, $anio);
        if ($lineas->isEmpty() && ($anioSolicitado === null || $anio === $anioVigente)) {
            $ultimo = DB::table('selecciones')->where('empleado_id', $emp->id)->max('anio');
            if ($ultimo !== null) {
                $anio = (int) $ultimo;
                $lineas = $this->getSelecciones($emp->id, $anio);
            }
        }

        return ['lineas' => $lineas, 'anio_datos' => $anio];
    }

    private function textoDescripcionLinea(array $row): string
    {
        $partes = [trim((string) ($row['descripcion'] ?? ''))];
        $marca = trim((string) ($row['marca'] ?? ''));
        $codigo = trim((string) ($row['codigo'] ?? ''));
        if ($marca !== '') {
            $partes[] = 'MARCA '.$marca.'.';
        }
        if ($codigo !== '') {
            $partes[] = 'CÓDIGO '.$codigo.'.';
        }

        return trim(implode(' ', array_filter($partes)));
    }

    /**
     * @return array<string, mixed>
     */
    private function datosVistaAcuse(Empleado $emp, ?int $anioQuery): array
    {
        $emp->loadMissing(['dependencia:id,clave,nombre', 'delegacion:id,clave']);
        $licitacion = env('ACUSE_LICITACION', 'LPN-SA-SA-0036-08/2025');
        $codigoUr = env('ACUSE_CODIGO_UR', $emp->delegacion?->clave ?? '—');

        $resolved = $this->lineasAcuseParaEmpleado($emp, $anioQuery);
        $lineas = $resolved['lineas'];
        $anioDatos = $resolved['anio_datos'];

        $rows = $lineas->values()->map(function (array $row, int $idx) {
            return [
                'num' => $idx + 1,
                'descripcion' => $this->textoDescripcionLinea($row),
                'talla' => (string) ($row['talla'] ?? '—'),
                'cantidad' => (int) ($row['cantidad'] ?? 0),
            ];
        });

        $totalPiezas = (int) $rows->sum('cantidad');
        $claveDel = strtoupper(trim((string) ($emp->delegacion?->clave ?? 'X')));
        $folio = $claveDel.'-'.$emp->id;

        return [
            'anio_encabezado' => $anioDatos,
            'licitacion' => $licitacion,
            'codigo_ur' => $codigoUr,
            'folio' => $folio,
            'nombre_empleado' => strtoupper($emp->nombre_completo),
            'nue' => trim((string) ($emp->nue ?? '')),
            'secretaria_dependencia' => strtoupper(trim((string) ($emp->dependencia?->nombre ?? ''))),
            'rows' => $rows->all(),
            'total_piezas' => $totalPiezas,
        ];
    }

    private function renderPdfBinary(Empleado $emp, ?int $anioQuery): string
    {
        $data = $this->datosVistaAcuse($emp, $anioQuery);

        return Pdf::loadView('pdf.acuse-vestuario', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true)
            ->output();
    }

    public function empleado(Request $request, int $empleado): Response
    {
        if (! $this->usuarioPuedeVerAcuseEmpleado($request, $empleado)) {
            return response()->json(['message' => 'No tiene permiso para generar el acuse de este colaborador.'], 403);
        }

        $emp = Empleado::find($empleado);
        if (! $emp) {
            return response()->json(['message' => 'Colaborador no encontrado.'], 404);
        }

        $anioQuery = $request->has('anio') ? (int) $request->get('anio') : null;
        if ($anioQuery !== null && ($anioQuery < 2000 || $anioQuery > 2100)) {
            return response()->json(['message' => 'Año no válido.'], 422);
        }

        $binary = $this->renderPdfBinary($emp, $anioQuery);
        $nueSlug = preg_replace('/[^a-zA-Z0-9_-]+/', '_', (string) ($emp->nue ?? 'sin-nue')) ?? 'sin-nue';
        $filename = 'Acuse_vestuario_'.$nueSlug.'_'.$emp->id.'.pdf';

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function delegacionZip(Request $request, int $delegacion): Response
    {
        if (! $this->usuarioPuedeExportarDelegacion($request, $delegacion)) {
            return response()->json(['message' => 'No tiene permiso para exportar acuses de esta delegación.'], 403);
        }

        $del = DB::table('delegaciones')->where('id', $delegacion)->first();
        if (! $del) {
            return response()->json(['message' => 'Delegación no encontrada.'], 404);
        }

        $anioQuery = $request->has('anio') ? (int) $request->get('anio') : null;
        if ($anioQuery !== null && ($anioQuery < 2000 || $anioQuery > 2100)) {
            return response()->json(['message' => 'Año no válido.'], 422);
        }

        $ids = Empleado::query()->where('delegacion_id', $delegacion)->orderBy('nue')->pluck('id');
        if ($ids->isEmpty()) {
            return response()->json(['message' => 'No hay colaboradores en esta delegación.'], 422);
        }

        $zipPath = tempnam(sys_get_temp_dir(), 'acuses_');
        if ($zipPath === false) {
            return response()->json(['message' => 'No se pudo crear el archivo temporal.'], 500);
        }
        unlink($zipPath);
        $zipPath .= '.zip';

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'No se pudo crear el archivo ZIP.'], 500);
        }

        foreach ($ids as $eid) {
            $emp = Empleado::find($eid);
            if (! $emp) {
                continue;
            }
            if (! $this->usuarioPuedeVerAcuseEmpleado($request, (int) $eid)) {
                continue;
            }
            $pdf = $this->renderPdfBinary($emp, $anioQuery);
            $nueSlug = preg_replace('/[^a-zA-Z0-9_-]+/', '_', (string) ($emp->nue ?? 'sin-nue')) ?? 'sin-nue';
            $zip->addFromString('Acuse_'.$nueSlug.'_'.$emp->id.'.pdf', $pdf);
        }

        $zip->close();

        $clave = preg_replace('/[^a-zA-Z0-9_-]+/', '_', (string) ($del->clave ?? 'delegacion')) ?? 'delegacion';
        $zipName = 'Acuses_vestuario_'.$clave.'.zip';
        $contents = file_get_contents($zipPath);
        @unlink($zipPath);

        if ($contents === false) {
            return response()->json(['message' => 'Error al leer el ZIP generado.'], 500);
        }

        return response($contents, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="'.$zipName.'"',
        ]);
    }
}
