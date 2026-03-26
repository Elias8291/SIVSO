<?php

namespace App\Support;

/**
 * Reglas de vestuario y presupuesto al cambiar UR / delegación o dar de alta a un colaborador.
 *
 * En el sistema, el gasto consolidado por unidad responsable se calcula con
 * {@see \App\Http\Controllers\Api\VestuarioController::totalGastoDependenciaAnio}:
 * suma de selecciones de todos los empleados con esa dependencia_id (UR).
 *
 * - **Solo cambia la delegación, misma UR:** el colaborador sigue en la misma
 *   dependencia_id; no se “abre” un recurso nuevo a nivel UR por el solo hecho
 *   del traslado. Mantiene su tope de vestuario respecto a la asignación ya
 *   registrada (importe base de su selección en el ejercicio); lo que cambia es
 *   la delegación organizacional y la forma en que elige/ajusta productos.
 *
 * - **Cambia de UR (o alta en otra UR):** el empleado pasa a otra dependencia_id;
 *   su gasto de vestuario deja de contar en la UR anterior y cuenta en la nueva.
 *   Debe tener asignación y selección acorde en la nueva delegación; el total
 *   gastado de la UR de destino refleja ese recurso.
 *
 * - **Nuevo ingreso:** se incorpora un colaborador con su asignación de recurso
 *   para vestuario; al elegir productos en el periodo autorizado, el importe
 *   suma al gasto de la UR correspondiente.
 */
final class VestuarioReglasUbicacion
{
    /** Texto para formulario de alta (sin UR previa). */
    public const MSG_ALTA = 'Los nuevos ingresos reciben su asignación de recurso para vestuario en la UR elegida; al seleccionar productos en el periodo autorizado, ese importe se suma al gasto consolidado de esa unidad responsable.';

    /** Solo cambió delegación; misma UR. */
    public const MSG_MISMA_UR_SOLO_DELEGACION = 'Si solo cambia la delegación dentro de la misma UR, el colaborador conserva el mismo marco de presupuesto de vestuario respecto a su asignación ya registrada: no se genera un recurso adicional en la UR por el traslado. Deberá revisar o ajustar su vestuario según la nueva delegación; el gasto de la UR sigue contabilizándose en conjunto para quienes pertenecen a esa unidad.';

    /** Cambió la UR. */
    public const MSG_CAMBIO_UR = 'Si pasa a otra unidad responsable (distinta UR), el vestuario se entiende en el contexto de la nueva UR: debe contar con la asignación y la selección de productos correspondientes en la nueva delegación. El gasto dejará de reflejarse en la UR anterior y pasará a la nueva según sus selecciones, aumentando el total gastado en esa UR en la medida de su importe.';

    /**
     * Mensaje contextual para UI/API según tipo de cambio en el formulario.
     *
     * @param  bool  $esAlta  true = registro nuevo (no hay UR previa).
     * @param  string|null  $claveUrInicial  UR al cargar el registro (edición).
     * @param  string|null  $claveUrFormulario  UR seleccionada ahora.
     * @param  string|null  $claveDelInicial  Delegación inicial (edición).
     * @param  string|null  $claveDelFormulario  Delegación seleccionada ahora.
     */
    public static function mensajeFormulario(
        bool $esAlta,
        ?string $claveUrInicial,
        ?string $claveUrFormulario,
        ?string $claveDelInicial,
        ?string $claveDelFormulario,
    ): ?string {
        if ($esAlta) {
            return self::MSG_ALTA;
        }

        $urIni = $claveUrInicial !== null ? trim($claveUrInicial) : '';
        $urForm = $claveUrFormulario !== null ? trim($claveUrFormulario) : '';
        $delIni = $claveDelInicial !== null ? trim($claveDelInicial) : '';
        $delForm = $claveDelFormulario !== null ? trim($claveDelFormulario) : '';

        if ($urForm === '' && $delForm === '') {
            return null;
        }

        if ($urIni !== '' && $urForm !== '' && $urIni !== $urForm) {
            return self::MSG_CAMBIO_UR;
        }

        if ($urIni !== '' && $urForm !== '' && $urIni === $urForm
            && $delIni !== '' && $delForm !== '' && $delIni !== $delForm) {
            return self::MSG_MISMA_UR_SOLO_DELEGACION;
        }

        return null;
    }
}
