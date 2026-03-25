<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Services\AcuseVestuarioService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicAcuseVestuarioController extends Controller
{
    public function show(Request $request, AcuseVestuarioService $service): View
    {
        $empleadoId = (int) $request->query('empleado', 0);
        $anio = (int) $request->query('anio', 0);
        if ($empleadoId < 1 || $anio < 2000 || $anio > 2100) {
            abort(404);
        }

        $emp = Empleado::query()->find($empleadoId);
        if (! $emp) {
            abort(404);
        }

        $v = (string) $request->query('v', '');

        $data = $service->datasetFor($emp, $anio, true);

        if ($v !== '') {
            $actual = $service->tokenIntegridadActualEnBd($emp->id, $anio);
            if (hash_equals($actual, $v)) {
                $data['verificacion_ok'] = true;
                $data['verificacion_mensaje'] = 'Los artículos y cantidades registrados en el sistema coinciden con el acuse emitido.';
            } else {
                $data['verificacion_ok'] = false;
                $data['verificacion_mensaje'] = 'El registro actual en el sistema no coincide con este acuse. Pudo modificarse el vestuario después de generar el PDF, o el documento en papel no corresponde a esta constancia en línea.';
            }
        } else {
            $data['verificacion_ok'] = null;
            $data['verificacion_mensaje'] = 'Este enlace no trae código de integridad (por ejemplo, acuse generado antes de esta función). Vuelva a descargar el PDF para obtener validación automática.';
        }

        return view('public.acuse-vestuario', $data);
    }
}
