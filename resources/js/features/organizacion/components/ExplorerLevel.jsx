/**
 * Contenedor de nivel: Panel desktop o MobileLevel móvil.
 */
import { ChevronLeft, Plus } from 'lucide-react';
import ExplorerInput from './ExplorerInput';
import ExplorerEmpty from './ExplorerEmpty';
import ExplorerSpinner from './ExplorerSpinner';

export function Panel({
    title,
    icon: Icon,
    count,
    search,
    onSearch,
    onSearchFocus,
    onAdd,
    addLabel,
    locked,
    stepHint,
    children,
}) {
    return (
        <div
            className={`flex flex-col h-full rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-300 ${
                locked
                    ? 'border-zinc-100 dark:border-zinc-800/50 opacity-50 pointer-events-none'
                    : 'border-zinc-100 dark:border-zinc-800/80'
            }`}
        >
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-zinc-50 dark:border-zinc-800/60 space-y-3">
                {stepHint && (
                    <span className="inline-block text-[9px] font-bold text-brand-gold uppercase tracking-wider">
                        {stepHint}
                    </span>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                            <Icon size={14} className="text-brand-gold" strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            {title}
                        </span>
                        {count > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] font-bold flex items-center justify-center">
                                {count}
                            </span>
                        )}
                    </div>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Plus size={11} strokeWidth={2.5} /> {addLabel}
                        </button>
                    )}
                </div>
                <ExplorerInput
                    placeholder={`Buscar ${title.toLowerCase()}...`}
                    value={search}
                    onChange={onSearch}
                    onFocus={onSearchFocus}
                />
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
    );
}

export function MobileLevel({
    title,
    subtitle,
    icon: Icon,
    search,
    onSearch,
    onSearchFocus,
    onAdd,
    addLabel,
    loading,
    empty,
    emptyText,
    emptySub,
    onBack,
    backLabel,
    children,
}) {
    return (
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-zinc-50 dark:border-zinc-800/60 space-y-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[11px] font-semibold text-brand-gold hover:underline"
                    >
                        <ChevronLeft size={14} strokeWidth={2.5} /> Volver a {backLabel}
                    </button>
                )}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                            <Icon size={18} className="text-brand-gold" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 truncate">{title}</h3>
                            {subtitle && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold shrink-0"
                        >
                            <Plus size={12} strokeWidth={2.5} /> {addLabel}
                        </button>
                    )}
                </div>
                <ExplorerInput
                    placeholder="Buscar..."
                    value={search}
                    onChange={onSearch}
                    onFocus={onSearchFocus}
                    onClick={onSearchFocus}
                />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                {loading ? (
                    <ExplorerSpinner />
                ) : empty ? (
                    <ExplorerEmpty icon={Icon} text={emptyText} sub={emptySub} />
                ) : (
                    <div className="px-3 space-y-2">{children}</div>
                )}
            </div>
        </div>
    );
}
