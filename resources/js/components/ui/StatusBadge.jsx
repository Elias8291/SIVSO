const VARIANTS = {
    entregado: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    activo:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    pendiente: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    inactivo:  'bg-zinc-50  dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-100 dark:border-zinc-700',
    cancelado: 'bg-zinc-50  dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-100 dark:border-zinc-700',
};

const DOTS = {
    entregado: 'bg-zinc-800 dark:bg-zinc-200',
    activo:    'bg-zinc-800 dark:bg-zinc-200',
    pendiente: 'bg-zinc-400 dark:bg-zinc-500',
    inactivo:  'bg-zinc-300 dark:bg-zinc-600',
    cancelado: 'bg-zinc-300 dark:bg-zinc-600',
};

export default function StatusBadge({ status }) {
    const key = status?.toLowerCase() ?? '';
    const variant = VARIANTS[key] ?? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700';
    const dot    = DOTS[key]    ?? 'bg-zinc-400';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${variant}`}>
            <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
            {status}
        </span>
    );
}
