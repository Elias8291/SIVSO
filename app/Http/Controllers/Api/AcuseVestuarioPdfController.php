<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use App\Services\AcuseVestuarioService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
        if ($request->user()->can('ver_empleados') || $request->user()->can('ver_delegaciones')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegacionIdsQueGestionaElUsuario($request)->contains($delegacionId);
    }

    /** Incluir colaborador en PDF lote: misma delegación y permiso acorde al rol. */
    private function puedeIncluirEmpleadoEnLoteDelegacion(Request $request, Empleado $emp, int $delegacionId): bool
    {
        if ((int) $emp->delegacion_id !== $delegacionId) {
            return false;
        }

        if ($request->user()->can('ver_empleados') || $request->user()->can('ver_delegaciones')) {
            return true;
        }

        return $request->user()->can('ver_mi_delegacion')
            && $this->delegadoPuedeGestionarEmpleadoId($request, (int) $emp->id);
    }

    /**
     * Misma lógica que {@see VestuarioController::resolverEmpleadoDelUsuarioAutenticado}.
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

    /**
     * PDF de acuse para el colaborador autenticado (Mi vestuario), sin pasar ID de empleado.
     */
    public function miVestuarioAcusePdf(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        if ($user instanceof User) {
            $this->asegurarNueUsuarioDesdeEmpleadoSiFalta($user);
        }
        $empleado = $this->resolverEmpleadoDelUsuarioAutenticado($user);
        if (! $empleado) {
            return response()->json(['message' => 'No hay registro de empleado vinculado a su cuenta.'], 403);
        }

        $anioQuery = $request->has('anio') ? (int) $request->get('anio') : null;
        if ($anioQuery !== null && ($anioQuery < 2000 || $anioQuery > 2100)) {
            return response()->json(['message' => 'Año no válido.'], 422);
        }

        $binary = $this->renderPdfBinary($empleado, $anioQuery);
        $nueSlug = preg_replace('/[^a-zA-Z0-9_-]+/', '_', (string) ($empleado->nue ?? 'sin-nue')) ?? 'sin-nue';
        $filename = 'Acuse_vestuario_'.$nueSlug.'_'.$empleado->id.'.pdf';

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    private function renderPdfBinary(Empleado $emp, ?int $anioQuery): string
    {
        $data = $this->acuseService->datasetFor($emp, $anioQuery, false);

        return Pdf::loadView('pdf.acuse-vestuario', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', false)
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

    /** Un solo PDF con una página (o conjunto de páginas) por colaborador. */
    public function delegacionPdfLote(Request $request, int $delegacion): Response
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

        $depClaveFiltro = trim((string) $request->get('dependencia_clave', ''));
        $dependenciaIdFiltro = null;
        if ($depClaveFiltro !== '') {
            $depId = (int) (DB::table('dependencias')->where('clave', $depClaveFiltro)->value('id') ?? 0);
            if ($depId < 1) {
                return response()->json(['message' => 'Unidad responsable no encontrada.'], 422);
            }
            $vinculada = DB::table('dependencia_delegacion')
                ->where('delegacion_id', $delegacion)
                ->where('dependencia_id', $depId)
                ->exists();
            if (! $vinculada) {
                return response()->json(['message' => 'Esta UR no está vinculada a la delegación indicada.'], 422);
            }
            $dependenciaIdFiltro = $depId;
        }

        $empQuery = Empleado::query()
            ->with(['dependencia:id,clave,nombre', 'delegacion:id,clave'])
            ->where('delegacion_id', $delegacion);
        if ($dependenciaIdFiltro !== null) {
            $empQuery->where('dependencia_id', $dependenciaIdFiltro);
        }
        $empleados = $empQuery->orderBy('nue')->get();

        if ($empleados->isEmpty()) {
            $msg = $dependenciaIdFiltro !== null
                ? 'No hay colaboradores de esta delegación adscritos a la unidad responsable indicada.'
                : 'No hay colaboradores en esta delegación.';

            return response()->json(['message' => $msg], 422);
        }

        $filtrados = $empleados->filter(
            fn (Empleado $emp) => $this->puedeIncluirEmpleadoEnLoteDelegacion($request, $emp, $delegacion)
        );

        if ($filtrados->isEmpty()) {
            return response()->json(['message' => 'No hay acuses que pueda exportar para esta delegación.'], 422);
        }

        $acusets = $this->acuseService->datasetsParaPdfLote($filtrados, $anioQuery);

        $binary = Pdf::loadView('pdf.acuse-vestuario-lote', ['acusets' => $acusets])
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', false)
            ->output();

        $clave = preg_replace('/[^a-zA-Z0-9_-]+/', '_', (string) ($del->clave ?? 'delegacion')) ?? 'delegacion';
        $slugUr = $depClaveFiltro !== ''
            ? '_UR_'.(preg_replace('/[^a-zA-Z0-9_-]+/', '_', $depClaveFiltro) ?? 'ur')
            : '';
        $slugEjercicio = $request->has('anio')
            ? '_Ej'.preg_replace('/[^0-9]+/', '', (string) $request->get('anio'))
            : '';
        $filename = 'Acuses_vestuario_'.$clave.$slugUr.$slugEjercicio.'.pdf';

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
