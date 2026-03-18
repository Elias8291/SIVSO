/**
 * Pill del stepper móvil.
 */
export default function ExplorerStepPill({ active, done, label }) {
    return (
        <span
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                active ? 'bg-[#AF9460] text-white shadow-md' : done ? 'bg-[#AF9460]/20 text-[#AF9460]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}
        >
            {done && <span className="size-1.5 rounded-full bg-[#AF9460]" />}
            {label}
        </span>
    );
}
