import { Plus } from 'lucide-react';

/**
 * Par de acciones «alta»: barra superior (desktop) + FAB (móvil), mismo criterio que Empleados.
 */
export default function PageAddButton({ onClick, label, iconSize = 14 }) {
    return (
        <>
            <button
                type="button"
                onClick={onClick}
                className="hidden sm:flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 hover:scale-105 active:scale-[0.98] transition-all whitespace-nowrap"
            >
                <Plus size={iconSize} strokeWidth={2.5} /> {label}
            </button>
            <button
                type="button"
                onClick={onClick}
                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md shadow-black/10 dark:shadow-white/5 border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300"
                aria-label={label}
            >
                <Plus size={18} strokeWidth={2.5} />
            </button>
        </>
    );
}
