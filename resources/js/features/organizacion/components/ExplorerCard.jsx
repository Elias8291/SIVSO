/**
 * Tarjetas reutilizables del Explorador.
 */
import { ChevronRight, IdCard, ClipboardList } from 'lucide-react';

const EditIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </svg>
);

/** ItemCard: Dependencia o Delegación en desktop */
export function ItemCard({ item, selected, onClick, onEdit, onDelete, stats }) {
    return (
        <div
            onClick={onClick}
            className={`group relative mx-3 my-1.5 rounded-xl px-4 py-3.5 cursor-pointer transition-all border select-none ${
                selected
                    ? 'bg-brand-gold/8 border-brand-gold/30 shadow-sm'
                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:border-zinc-100 dark:hover:border-zinc-800'
            }`}
        >
            {selected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-brand-gold rounded-r-full" />
            )}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black tracking-wider font-mono ${selected ? 'text-brand-gold' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {item.clave}
                        </span>
                    </div>
                    <p className={`text-[12px] font-semibold leading-tight truncate ${selected ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {item.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        {stats.map(({ icon: StatIcon, value, label }) => (
                            <span key={label} className="flex items-center gap-1 text-[9px] text-zinc-400">
                                <StatIcon size={10} strokeWidth={2} />
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">{value}</span> {label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                        title="Editar"
                        className="size-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-brand-gold hover:bg-brand-gold/10 transition-all"
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}
                        title="Eliminar"
                        className="size-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>
            {selected && <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gold" strokeWidth={2.5} />}
        </div>
    );
}

/** MobileCard: Para móvil (Dependencia, Delegación) */
export function MobileCard({ badge, title, stats, onClick, onEdit, onDelete }) {
    return (
        <div
            onClick={onClick}
            className="group relative rounded-2xl px-4 py-4 cursor-pointer transition-all border border-zinc-100 dark:border-zinc-800/60 hover:border-brand-gold/30 hover:bg-brand-gold/5 active:scale-[0.99]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-brand-gold/15 text-brand-gold text-[10px] font-black font-mono tracking-wider mb-2">
                        {badge}
                    </span>
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">{title}</p>
                    <div className="flex items-center gap-4 mt-2">
                        {stats.map(({ icon: StatIcon, value, label }) => (
                            <span key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                <StatIcon size={12} strokeWidth={2} className="text-zinc-400" />
                                <span className="font-bold">{value}</span> {label}
                            </span>
                        ))}
                    </div>
                </div>
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-brand-gold shrink-0 mt-1" strokeWidth={2.5} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-10">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} title="Editar"
                        className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-brand-gold hover:bg-brand-gold/10">
                        <EditIcon />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} title="Eliminar"
                        className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}

/** TrabajadorCard */
export function TrabajadorCard({ trab, selected, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`mx-3 my-1.5 rounded-xl px-4 py-3 border cursor-pointer transition-all ${
                selected
                    ? 'bg-brand-gold/8 border-brand-gold/30 shadow-sm'
                    : 'border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <IdCard size={14} className="text-brand-gold" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{trab.nombre_completo}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-400">NUE: {trab.nue}</span>
                        <span className="text-[9px] text-zinc-400">{trab.delegacion}</span>
                    </div>
                </div>
                {selected && <ChevronRight size={14} className="text-brand-gold shrink-0" strokeWidth={2.5} />}
            </div>
        </div>
    );
}

/** ProgramaCard */
export function ProgramaCard({ prog }) {
    return (
        <div className="mx-3 my-1.5 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
            <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={14} className="text-brand-gold" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">{prog.clave}</span>
                    <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight mt-0.5">
                        {prog.descripcion || prog.partida || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                        {prog.cantidad > 0 && <span className="text-[9px] font-bold text-zinc-500">Cant: {prog.cantidad}</span>}
                        {prog.talla && <span className="text-[9px] text-zinc-400">Talla: {prog.talla}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
