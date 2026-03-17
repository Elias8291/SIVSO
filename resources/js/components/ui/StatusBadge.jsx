const VARIANTS = {
    entregado: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    activo:    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    pendiente: 'bg-amber-50   dark:bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-100  dark:border-amber-500/20',
    inactivo:  'bg-zinc-50    dark:bg-zinc-800       text-zinc-500   dark:text-zinc-400   border-zinc-100  dark:border-zinc-700',
    cancelado: 'bg-red-50     dark:bg-red-500/10    text-red-600    dark:text-red-400    border-red-100    dark:border-red-500/20',
};

const DOTS = {
    entregado: 'bg-emerald-500',
    activo:    'bg-emerald-500',
    pendiente: 'bg-amber-500',
    inactivo:  'bg-zinc-400',
    cancelado: 'bg-red-500',
};

export default function StatusBadge({ status }) {
    const key = status?.toLowerCase() ?? '';
    const variant = VARIANTS[key] ?? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700';
    const dot    = DOTS[key]    ?? 'bg-zinc-400';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${variant}`}>
            <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
            {status}
        </span>
    );
}
