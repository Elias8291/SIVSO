<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use App\Services\AcuseVestuarioService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class AcuseVestuarioPdfController extends Controller
{
    public function __construct(private AcuseVestuarioService $acuseService) {}

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

    private function renderPdfBinary(Empleado $emp, ?int $anioQuery): string
    {
        $data = $this->acuseService->datasetFor($emp, $anioQuery, false);

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
