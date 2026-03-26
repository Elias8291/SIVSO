/**
 * Contenedor de <select> con el mismo lenguaje visual que SearchInput (Mi delegación).
 */
export default function FilterSelectShell({
    id,
    label,
    icon: Icon,
    locked = false,
    className = 'sm:w-[11.25rem]',
    children,
}) {
    return (
        <div className={`w-full min-w-0 shrink-0 ${className}`}>
            <label
                htmlFor={id}
                className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400"
            >
                {label}
            </label>
            <div
                className={`flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:shadow-[0_0_0_1px_rgba(175,148,96,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-brand-gold/35 sm:px-3 sm:py-2 ${locked ? 'pointer-events-none opacity-50' : ''}`}
            >
                <Icon className="size-4 shrink-0 pointer-events-none text-zinc-400 dark:text-zinc-500" strokeWidth={1.6} aria-hidden />
                {children}
            </div>
        </div>
    );
}
