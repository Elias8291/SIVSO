/**
 * PageHeader
 *
 * Layout:
 *   Fila 1 → título (izq) + botones de acción (der)
 *   Fila 2 → buscador ancho (opcional, ocupa todo el espacio)
 *
 * Props:
 *   title       string
 *   description string  (opcional)
 *   actions     node    (solo botones, sin buscador)
 *   search      node    (el <SearchInput> o similar)
 */
export default function PageHeader({ title, description, actions, search }) {
    return (
        <header className="mb-8 space-y-3">
            {/* Fila 1: título + acciones */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        {actions}
                    </div>
                )}
            </div>

            {/* Fila 2: buscador ancho */}
            {search && (
                <div className="w-full">
                    {search}
                </div>
            )}
        </header>
    );
}
