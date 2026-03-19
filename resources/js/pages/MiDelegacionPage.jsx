/**
 * Mi Delegación — Tus delegaciones y empleados. Listas expandibles, diseño simple, vestuario editable.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Building2, User } from 'lucide-react';
import { PageHeader, SearchInput, Card } from '../components/ui';
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
        <div>
            <PageHeader
                title="Mi Delegación"
                description="Tus delegaciones y empleados asignados."
                search={
                    <SearchInput
                        placeholder="Buscar empleado por nombre o NUE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                }
            />

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                </div>
            ) : delegaciones.length === 0 ? (
                <Card>
                    <div className="px-5 py-12 text-center flex flex-col items-center justify-center">
                        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">Sin delegaciones</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">{message || 'Asigna un delegado en Mi Cuenta para empezar.'}</p>
                        <Link to="/dashboard/mi-cuenta" className="inline-flex px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
                            Ir a Mi Cuenta
                        </Link>
                    </div>
                </Card>
            ) : (
                <Card title={`Delegaciones Asignadas (${delegaciones.length})`}>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
                        {delegaciones.map((del) => {
                            const empleados = filterTrab(empleadosPorDelegacion[del.id]);
                            const loadingEmpleados = empleadosPorDelegacion[del.id] === undefined;
                            const abierta = expandidas[del.id] !== false;

                            return (
                                <div key={del.id} className="bg-white dark:bg-[#0F0F10]">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(del.id)}
                                        className={`w-full flex items-center justify-between gap-4 px-6 py-4 min-h-[64px] text-left transition-colors group ${abierta ? 'bg-zinc-50/50 dark:bg-[#111111]/50' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30'}`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${abierta ? 'bg-[#AF9460]/10 text-[#AF9460] shadow-sm shadow-[#AF9460]/5' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                                <Building2 size={18} strokeWidth={2.2} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider truncate">{del.clave}</p>
                                                <p className="text-[12px] text-zinc-500 font-medium mt-0.5">{del.trabajadores_count} colaboradores asignados</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 transition-all duration-300 ${abierta ? 'text-[#AF9460]' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500'}`}>
                                            {abierta ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
                                        </span>
                                    </button>

                                    {abierta && (
                                        <div className="border-t border-dashed border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-transparent">
                                            {loadingEmpleados ? (
                                                <div className="flex justify-center py-10">
                                                    <span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
                                                </div>
                                            ) : empleados.length === 0 ? (
                                                <div className="px-6 py-8 text-center">
                                                    <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                                                        {search.trim() ? 'No se encontraron coincidencias.' : 'No hay colaboradores asignados a esta delegación.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-zinc-100/50 dark:divide-zinc-800/30 pb-2">
                                                    {empleados.map((trab) => (
                                                        <div key={trab.id} className="w-full flex items-center justify-between gap-4 px-6 py-3 hover:bg-white dark:hover:bg-[#111111]/80 transition-all group/item">
                                                            <div className="flex items-center gap-4 min-w-0 pl-[56px]">
                                                                <div className="size-8 rounded-full bg-white dark:bg-[#080808] shadow-sm flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                                    <User size={13} strokeWidth={2.5} className="text-zinc-400 dark:text-zinc-500 group-hover/item:text-[#AF9460] transition-colors" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover/item:text-[#AF9460] transition-colors">{trab.nombre_completo}</p>
                                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">NUE: {trab.nue}</p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 flex items-center">
                                                                <button
                                                                    onClick={() => setEmpleadoVestuario(trab)}
                                                                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#111111] text-zinc-600 dark:text-zinc-300 text-[11px] font-bold group-hover/item:bg-[#AF9460] group-hover/item:text-white shadow-sm transition-all border border-zinc-200/50 dark:border-zinc-700/50 group-hover/item:border-[#AF9460]/20 hover:scale-[1.03] active:scale-[0.97]"
                                                                >
                                                                    Ver Vestuario
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            <VestuarioEmpleadoModal
                empleado={empleadoVestuario}
                onClose={() => setEmpleadoVestuario(null)}
                onSaved={() => { }}
            />
        </div>
    );
}
