import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader, DataTable } from '../components/ui';
import { api } from '../lib/api';
import VestuarioEmpleadoModal from '../features/mi-delegacion/VestuarioEmpleadoModal';
import CrearUsuarioEmpleadoModal from '../features/mi-delegacion/CrearUsuarioEmpleadoModal';

export default function MiDelegacionPage() {
    const [delegaciones, setDelegaciones] = useState([]);
    const [empleadosPorDelegacion, setEmpleadosPorDelegacion] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [successFlash, setSuccessFlash] = useState(null);
    const [search, setSearch] = useState('');
    const [empleadoVestuario, setEmpleadoVestuario] = useState(null);
    const [crearUsuarioCtx, setCrearUsuarioCtx] = useState(null);
    const [expandidas, setExpandidas] = useState({});

    const toggleExpand = (id) => setExpandidas((p) => ({ ...p, [id]: !p[id] }));

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
                api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(del.clave)}&per_page=100`)
                    .then((res) => ({ id: del.id, data: res.data ?? [] }))
                    .catch((err) => { console.error("Error fetching empleados for", del.clave, err); return { id: del.id, data: [] }; })
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

    const aplicarUsuarioCreado = (delegacionId, empleadoId, user) => {
        setEmpleadosPorDelegacion((prev) => {
            const list = prev[delegacionId];
            if (!list) return prev;
            return {
                ...prev,
                [delegacionId]: list.map((row) =>
                    row.id === empleadoId ? { ...row, user_id: user?.id ?? row.user_id } : row
                ),
            };
        });
    };

    const buildColumns = (delegacionId) => [
        {
            key: 'nombre_completo',
            label: 'Empleado',
            render: (val, row) => (
                <div>
                    <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide leading-none">{val}</p>
                    <p className="text-[11px] text-zinc-400 mt-1.5 font-mono leading-none">NUE: {row.nue}</p>
                </div>
            )
        },
        {
            key: 'actualizado',
            label: 'Estado',
            render: (_, row) => (
                row.actualizado ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Actualizado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-zinc-400" />
                        Pendiente
                    </span>
                )
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex justify-end flex-wrap gap-2">
                    {!row.user_id && (
                        <button
                            type="button"
                            onClick={() => setCrearUsuarioCtx({ empleado: row, delegacionId })}
                            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all whitespace-nowrap"
                        >
                            Crear acceso
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setEmpleadoVestuario(row)}
                        className="px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider border border-brand-gold/20 hover:bg-brand-gold hover:text-white transition-all whitespace-nowrap"
                    >
                        Ver Vestuario
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader title="Mi Delegación" description="Tus delegaciones y empleados vinculados." />

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                </div>
            ) : delegaciones.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 px-4 py-16 text-center bg-white/50 dark:bg-zinc-900/20">
                    <h3 className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 mb-1.5 uppercase tracking-wider">Sin delegaciones</h3>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6 leading-relaxed">
                        {message || 'Asigna un delegado en Mi Cuenta.'}
                    </p>
                    <Link to="/dashboard/mi-cuenta" className="inline-flex px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-bold tracking-wide uppercase hover:opacity-90 transition-all">
                        Ir a Mi Cuenta
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 mb-8">
                        {successFlash && (
                            <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 text-[12px] text-emerald-800 dark:text-emerald-200">
                                {successFlash}
                            </div>
                        )}
                        <div className="flex flex-row flex-wrap sm:flex-nowrap items-stretch gap-3">
                            <input
                                type="text"
                                placeholder="Buscar empleado por nombre o NUE..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 min-w-0 px-3.5 py-2.5 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {delegaciones.map((del) => {
                            const empleados = filterTrab(empleadosPorDelegacion[del.id]);
                            const loadingEmpleados = empleadosPorDelegacion[del.id] === undefined;
                            const abierta = expandidas[del.id] !== false;

                            return (
                                <div key={del.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden shadow-sm shadow-black/5 dark:shadow-none transition-all duration-300">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(del.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-100 dark:border-zinc-800/60"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="size-1.5 bg-brand-gold rounded-full shrink-0" />
                                            <div>
                                                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                                                    Delegación: {del.clave}
                                                </h3>
                                                {del.delegado_nombre && (
                                                    <p className="text-[11px] text-zinc-400 mt-0.5">Delegado: {del.delegado_nombre}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-md border border-zinc-200/60 dark:border-zinc-700/50">
                                                {del.trabajadores_count} colaboradores
                                            </span>
                                            <span className="text-zinc-400 dark:text-zinc-500">
                                                {abierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </span>
                                        </div>
                                    </button>

                                    {abierta && (
                                        <div>
                                            <DataTable
                                                columns={buildColumns(del.id)}
                                                data={empleados}
                                                loading={loadingEmpleados}
                                                emptyMessage={search.trim() ? 'No se encontraron coincidencias.' : 'No hay colaboradores asignados.'}
                                            />
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
                onSaved={() => { }}
            />

            <CrearUsuarioEmpleadoModal
                empleado={crearUsuarioCtx?.empleado ?? null}
                delegacionId={crearUsuarioCtx?.delegacionId ?? null}
                onClose={() => setCrearUsuarioCtx(null)}
                onCreated={(res, meta) => {
                    if (res?.user && meta?.delegacionId != null && meta?.empleadoId != null) {
                        aplicarUsuarioCreado(meta.delegacionId, meta.empleadoId, res.user);
                    }
                    if (res?.message) setSuccessFlash(res.message);
                }}
            />
        </div>
    );
}
