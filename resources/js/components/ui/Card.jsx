export default function Card({ title, action, children, className = '' }) {
    return (
        <div
            className={`border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm rounded-xl overflow-hidden ${className}`}
        >
            {(title || action) && (
                <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-end justify-between gap-3">
                    {title && (
                        <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider min-w-0">
                            {title}
                        </h3>
                    )}
                    {action && <div className="shrink-0 ml-auto">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
