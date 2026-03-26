import { useId } from 'react';
import { Search } from 'lucide-react';

/** Buscador unificado (mismo patrón que Mi vestuario): borde + foco en el contenedor, icono, campo transparente. */
export default function SearchInput({
    placeholder = 'Buscar...',
    className = '',
    label,
    id: idProp,
    disabled,
    inputClassName = '',
    ...props
}) {
    const uid = useId();
    const inputId = idProp ?? `search-${uid.replace(/:/g, '')}`;

    return (
        <div className={`w-full ${className}`}>
            {label != null && label !== '' && (
                <label
                    htmlFor={inputId}
                    className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400"
                >
                    {label}
                </label>
            )}
            <div
                className={`flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:shadow-[0_0_0_1px_rgba(175,148,96,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-brand-gold/35 sm:px-3 sm:py-2 ${disabled ? 'opacity-50' : ''}`}
            >
                <Search
                    className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500 pointer-events-none"
                    strokeWidth={1.6}
                    aria-hidden
                />
                <input
                    id={inputId}
                    type="search"
                    autoComplete="off"
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`min-w-0 flex-1 border-0 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600 touch-manipulation disabled:cursor-not-allowed ${inputClassName}`}
                    {...props}
                />
            </div>
        </div>
    );
}
