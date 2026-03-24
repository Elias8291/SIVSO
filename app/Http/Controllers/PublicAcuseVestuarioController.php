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

        $data = $service->datasetFor($emp, $anio, true);

        return view('public.acuse-vestuario', $data);
    }
}
