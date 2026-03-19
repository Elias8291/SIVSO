/**
 * Pill del stepper móvil.
 */
export default function ExplorerStepPill({ active, done, label }) {
    return (
        <span
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                active ? 'bg-brand-gold text-white shadow-md' : done ? 'bg-brand-gold/20 text-brand-gold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}
        >
            {done && <span className="size-1.5 rounded-full bg-brand-gold" />}
            {label}
        </span>
    );
}
