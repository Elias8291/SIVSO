import { Search } from 'lucide-react';

export default function SearchInput({ placeholder = 'Buscar...', className = '', ...props }) {
    return (
        <div className={`relative w-full ${className}`}>
            <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={15}
                strokeWidth={1.8}
            />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/20 focus:border-[#AF9460]/40 transition-all"
                {...props}
            />
        </div>
    );
}
