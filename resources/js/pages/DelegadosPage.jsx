/**
 * Delegados — Vista de delegados y cuántas delegaciones representa cada uno.
 */
import { useState, useEffect } from 'react';
import { UserCheck, Building2, Users, Search } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { api } from '../lib/api';

export default function DelegadosPage() {
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchDelegados = () => {
        setLoading(true);
        const q = search.trim();
        const url = q ? `/api/delegados/resumen?search=${encodeURIComponent(q)}` : '/api/delegados/resumen';
        api.get(url)
            .then((res) => setDelegados(res.data ?? []))
            .catch(() => setDelegados([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDelegados();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDelegados();
    };

    return (
        <div className="mx-auto w-full max-w-5xl">
            <PageHeader
                title="Delegados"
                description="Delegados y cuántas delegaciones representa cada uno."
                compact
            />

            <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.8} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o delegación..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/50 focus:border-[#AF9460]"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#AF9460] text-white font-semibold text-sm hover:bg-[#9a8052] transition-colors"
                >
                    Buscar
                </button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                </div>
            ) : delegados.length === 0 ? (
                <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl px-6 py-12 text-center">
                    <div className="size-14 rounded-2xl bg-[#AF9460]/10 flex items-center justify-center mx-auto mb-4">
                        <UserCheck size={28} className="text-[#AF9460]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                        Sin delegados
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        No se encontraron delegados con los criterios de búsqueda.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {delegados.map((d) => (
                        <article
                            key={d.nombre}
                            className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-200 dark:hover:border-zinc-700/80 transition-colors"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="size-12 rounded-xl bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                                        <UserCheck size={22} className="text-[#AF9460]" strokeWidth={1.8} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                            {d.nombre}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 size={14} strokeWidth={1.8} />
                                                <strong className="text-zinc-700 dark:text-zinc-300">{d.delegaciones_count}</strong>
                                                {d.delegaciones_count === 1 ? ' delegación' : ' delegaciones'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users size={14} strokeWidth={1.8} />
                                                <strong className="text-zinc-700 dark:text-zinc-300">{d.trabajadores_total}</strong>
                                                {d.trabajadores_total === 1 ? ' trabajador' : ' trabajadores'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {d.delegaciones?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                        Delegaciones que representa
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {d.delegaciones.map((del) => (
                                            <span
                                                key={del.id}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                                            >
                                                {del.clave} (UR {del.ur})
                                                {del.trabajadores_count > 0 && (
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        · {del.trabajadores_count} trab.
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
