/**
 * Mi Delegación — Tus delegaciones y empleados. Listas expandibles, diseño simple, vestuario editable.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { api } from '../lib/api';
import VestuarioEmpleadoModal from '../features/mi-delegacion/VestuarioEmpleadoModal';

export default function MiDelegacionPage() {
    const [delegaciones, setDelegaciones] = useState([]);
    const [empleadosPorDelegacion, setEmpleadosPorDelegacion] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [search, setSearch] = useState('');
    const [expandidas, setExpandidas] = useState({});
    const [empleadoVestuario, setEmpleadoVestuario] = useState(null);

    useEffect(() => {
        api.get('/api/mi-delegacion')
            .then((res) => {
                const data = res.data ?? [];
                setDelegaciones(data);
                setMessage(res.message ?? null);
                setExpandidas(data.reduce((acc, d) => ({ ...acc, [d.id]: true }), {}));
            })
            .catch((err) => {
                setDelegaciones([]);
                setMessage(err.message || 'Error al cargar delegaciones.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (delegaciones.length === 0) return;
        setEmpleadosPorDelegacion({});
        Promise.all(
            delegaciones.map((del) =>
                api.get(`/api/trabajadores?delegado_id=${del.id}`)
                    .then((res) => ({ id: del.id, data: res.data ?? [] }))
                    .catch(() => ({ id: del.id, data: [] }))
            )
        ).then((results) => {
            const map = {};
            results.forEach(({ id, data }) => { map[id] = data; });
            setEmpleadosPorDelegacion(map);
        });
    }, [delegaciones]);

    const filterTrab = (trabajadores) => {
        if (!search.trim()) return trabajadores ?? [];
        const q = search.toLowerCase();
        return (trabajadores ?? []).filter(
            (t) =>
                (t.nombre_completo || '').toLowerCase().includes(q) ||
                (t.nue || '').toLowerCase().includes(q) ||
                (t.delegacion || '').toLowerCase().includes(q)
        );
    };

    const toggleExpand = (id) => setExpandidas((p) => ({ ...p, [id]: !p[id] }));

    return (
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-4">
            <PageHeader title="Mi Delegación" description="Tus delegaciones y empleados." compact />

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                </div>
            ) : delegaciones.length === 0 ? (
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-10 text-center">
                    <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">Sin delegaciones</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">{message || 'Asigna un delegado en Mi Cuenta.'}</p>
                    <Link to="/dashboard/mi-cuenta" className="inline-flex px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90">
                        Ir a Mi Cuenta
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.8} />
                        <input
                            type="search"
                            placeholder="Buscar empleados..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/20 focus:border-[#AF9460]/40"
                        />
                    </div>

                    <div className="space-y-3">
                        {delegaciones.map((del) => {
                            const empleados = filterTrab(empleadosPorDelegacion[del.id]);
                            const loadingEmpleados = empleadosPorDelegacion[del.id] === undefined;
                            const abierta = expandidas[del.id] !== false;

                            return (
                                <div key={del.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden bg-white dark:bg-[#0F0F10]">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(del.id)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{del.clave}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{del.trabajadores_count} empleados</p>
                                        </div>
                                        <span className="shrink-0 text-zinc-400">
                                            {abierta ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
                                        </span>
                                    </button>

                                    {abierta && (
                                        <div className="border-t border-zinc-50 dark:border-zinc-800/60">
                                            {loadingEmpleados ? (
                                                <div className="flex justify-center py-10">
                                                    <span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                                                </div>
                                            ) : empleados.length === 0 ? (
                                                <div className="px-4 py-8 text-center">
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {search.trim() ? 'Sin coincidencias.' : 'Sin empleados.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                                    {empleados.map((trab) => (
                                                        <button
                                                            key={trab.id}
                                                            type="button"
                                                            onClick={() => setEmpleadoVestuario(trab)}
                                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 active:bg-zinc-100 dark:active:bg-zinc-800/50 transition-colors"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{trab.nombre_completo}</p>
                                                                <p className="text-[11px] text-zinc-500 mt-0.5">NUE {trab.nue}</p>
                                                            </div>
                                                            <span className="text-[11px] font-medium text-[#AF9460] shrink-0">Ver vestuario</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <VestuarioEmpleadoModal
                empleado={empleadoVestuario}
                onClose={() => setEmpleadoVestuario(null)}
                onSaved={() => {}}
            />
        </div>
    );
}
