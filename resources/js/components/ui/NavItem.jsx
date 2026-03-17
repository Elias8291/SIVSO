export default function NavItem({ icon, label, active }) {
    return (
        <span
            className={`relative flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-150 ${
                active
                    ? 'bg-[#AF9460]/8 text-[#AF9460]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
        >
            {/* Indicador activo */}
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#AF9460] rounded-r-full" />
            )}

            <span className={`shrink-0 transition-colors ${active ? 'text-[#AF9460]' : ''}`}>
                {icon}
            </span>

            <span className={`text-[11px] font-semibold tracking-wide ${active ? 'text-[#AF9460]' : ''}`}>
                {label}
            </span>
        </span>
    );
}
