export default function Card({ title, action, children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden ${className}`}>
            {(title || action) && (
                <div className="px-6 py-4 border-b border-zinc-50 dark:border-zinc-800/60 flex items-center justify-between">
                    {title && (
                        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight border-l-2 border-brand-gold/35 pl-3">
                            {title}
                        </h3>
                    )}
                    {action && <div className="ml-auto">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
