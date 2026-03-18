/**
 * Delegados — Vista simple de delegados y cuántas delegaciones representa cada uno.
 */
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
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

    useEffect(() => { fetchDelegados(); }, []);

    const handleSearch = (e) => { e.preventDefault(); fetchDelegados(); };

    return (
        <div className="mx-auto w-full max-w-2xl px-0">
            <PageHeader title="Delegados" description="Delegados y delegaciones que representa cada uno." compact />

            <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.8} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/30"
                    />
                </div>
            </form>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                </div>
            ) : delegados.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">Sin delegados.</p>
            ) : (
                <div className="space-y-2">
                    {delegados.map((d) => (
                        <div
                            key={d.nombre}
                            className="rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 bg-white dark:bg-[#0F0F10]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{d.nombre}</p>
                                <span className="text-xs text-zinc-500 shrink-0">
                                    {d.delegaciones_count} del. · {d.trabajadores_total} trab.
                                </span>
                            </div>
                            {d.delegaciones?.length > 0 && (
                                <p className="text-[11px] text-zinc-400 mt-1 truncate">
                                    {d.delegaciones.map((del) => `${del.clave} (UR ${del.ur})`).join(', ')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
