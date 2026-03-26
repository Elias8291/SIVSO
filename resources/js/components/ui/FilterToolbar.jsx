/**
 * Bloque de filtros alineado con Mi delegación: ancho máximo y espaciado uniforme.
 */
export function FilterToolbar({ children, className = '' }) {
    return (
        <div className={`max-w-4xl space-y-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * Fila inferior: selects a la izquierda (wrap) y acción opcional a la derecha (ej. Limpiar filtros).
 */
export function FilterToolbarRow({ children, end = null }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-3">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3">
                {children}
            </div>
            {end}
        </div>
    );
}
