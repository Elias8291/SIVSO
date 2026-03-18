/**
 * Estado vacío del Explorador.
 */
export default function ExplorerEmpty({ icon: Icon, text, sub }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                <Icon size={22} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-zinc-500">{text}</p>
                {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}
