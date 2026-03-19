/**
 * Input estilizado para el Explorador. Soporta icono e onFocus.
 */
export default function ExplorerInput({
    placeholder = 'Buscar...',
    value,
    onChange,
    onFocus,
    onClick,
    className = '',
    ...props
}) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={onFocus}
            onClick={onClick}
            className={`w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-[12px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 transition-all ${className}`}
            {...props}
        />
    );
}
