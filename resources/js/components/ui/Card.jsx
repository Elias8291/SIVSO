export default function Card({ title, action, children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-[#0F0F10] rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden ${className}`}>
            {(title || action) && (
                <div className="px-6 py-4 border-b border-zinc-50 dark:border-zinc-800/60 flex items-center justify-between">
                    {title && (
                        <div className="flex items-center gap-2.5">
                            <span className="size-1.5 bg-[#AF9460] rounded-full shrink-0" />
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                {title}
                            </h3>
                        </div>
                    )}
                    {action && <div className="ml-auto">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
