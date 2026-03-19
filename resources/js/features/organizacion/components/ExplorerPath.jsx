/**
 * Breadcrumb del Explorador (desktop).
 */
import { ChevronRight, Building2, UserCheck } from 'lucide-react';

export default function ExplorerPath({ selDep, selDel, onReset, onBackToDep }) {
    return (
        <div className="flex items-center gap-2 mb-4 min-h-[32px]">
            <button
                onClick={onReset}
                className="text-[10px] font-bold text-zinc-400 hover:text-brand-gold uppercase tracking-wider transition-colors"
            >
                Estructura
            </button>
            {selDep && (
                <>
                    <ChevronRight size={12} className="text-zinc-300" />
                    <button
                        onClick={onBackToDep}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider"
                    >
                        <Building2 size={10} /> UR {selDep.clave}
                    </button>
                </>
            )}
            {selDel && (
                <>
                    <ChevronRight size={12} className="text-zinc-300" />
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                        <UserCheck size={10} /> {selDel.clave}
                    </span>
                </>
            )}
        </div>
    );
}
