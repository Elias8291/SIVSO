export default function StatCard({ label, value, icon }) {
    return (
        <div className="relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 overflow-hidden">
            <div className="flex items-start justify-between mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    {label}
                </p>
                <span className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400">
                    {icon}
                </span>
            </div>
            <p className="text-3xl font-black tracking-tight leading-none text-zinc-900 dark:text-white">
                {value}
            </p>
            <div className="h-[2px] w-6 mt-5 rounded-full bg-brand-gold/60" />
        </div>
    );
}
