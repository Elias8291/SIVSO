import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, Edit2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/ui';

const fmt = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n ?? 0);

const fmtCompact = (n) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
};

function ProgressBar({ pct, alerta }) {
    const clamped = Math.min(pct ?? 0, 100);
    const color =
        alerta === 'critico' ? 'bg-red-500'
            : alerta === 'alto' ? 'bg-amber-500'
                : 'bg-brand-gold';

    return (
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

function AlertaBadge({ pct }) {
    if (pct === null) return <span className="text-[12px] text-zinc-400">sin límite</span>;
    if (pct >= 100) return <span className="text-[12px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">EXCEDIDO</span>;
    if (pct >= 85) return <span className="text-[12px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">{pct}%</span>;
    return <span className="text-[12px] text-zinc-400">{pct}%</span>;
}

function nivelAlerta(pct) {
    if (pct === null) return 'ninguno';
    if (pct >= 100) return 'critico';
    if (pct >= 85) return 'alto';
    return 'ok';
}

function StatSummary({ label, gastado, limite, pct, icon }) {
    const nivel = nivelAlerta(pct);
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-center shrink-0 text-brand-gold">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">{label}</p>
                <p className="text-[18px] font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">{fmtCompact(gastado)}</p>
                {limite > 0 && (
                    <>
                        <p className="text-[12px] text-zinc-400 mt-1">Límite: {fmtCompact(limite)}</p>
                        <ProgressBar pct={pct} alerta={nivel} />
                    </>
                )}
            </div>
            {nivel !== 'ninguno' && nivel !== 'ok' && (
                <AlertTriangle
                    size={14}
                    className={nivel === 'critico' ? 'text-red-500' : 'text-amber-500'}
                    strokeWidth={2}
                />
            )}
        </div>
    );
}

function CeldaPartida({ col }) {
    const nivel = nivelAlerta(col.porcentaje);
    return (
        <td className="px-4 py-3 align-top">
            <div className="min-w-[130px]">
                <p className={`text-[14px] font-bold leading-none ${nivel === 'critico' ? 'text-red-600 dark:text-red-400'
                    : nivel === 'alto' ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}>{fmt(col.gastado)}</p>

                {col.limite > 0 ? (
                    <>
                        <p className="text-[12px] text-zinc-400 mt-0.5">
                            / {fmt(col.limite)}
                        </p>
                        <ProgressBar pct={col.porcentaje} alerta={nivel} />
                        <div className="mt-1">
                            <AlertaBadge pct={col.porcentaje} />
                        </div>
                    </>
                ) : (
                    <p className="text-[12px] text-zinc-400 mt-0.5">sin límite</p>
                )}
            </div>
        </td>
    );
}

export default function PartidasPage() {
    const anioActual = new Date().getFullYear();
    const [anio, setAnio] = useState(anioActual);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/partidas?anio=${anio}`, { credentials: 'include' });
            const json = await res.json();
            setData(json);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [anio]);

    useEffect(() => { load(); }, [load]);

    const rows = (data?.rows ?? []).filter((r) =>
        r.ur.toLowerCase().includes(search.toLowerCase()) ||
        r.nombre.toLowerCase().includes(search.toLowerCase())
    );

    const partidas = data?.partidas ?? [];

    const openEdit = (row) => {
        navigate('/dashboard/partidas/limites/editar', { state: { row, anio } });
    };

    const totalesGlobales = data?.totales_globales ?? [];
    const totalGastado = totalesGlobales.reduce((s, t) => s + t.gastado, 0);
    const totalLimite = totalesGlobales.reduce((s, t) => s + t.limite, 0);
    const totalPct = totalLimite > 0 ? Math.min(Math.round((totalGastado / totalLimite) * 100), 999) : null;

    const anosOpts = [anioActual - 1, anioActual, anioActual + 1];

    const getGridColsClass = () => {
        if (partidas.length === 0) return 'grid-cols-1 sm:grid-cols-3';
        const cols = Math.min(partidas.length + 1, 4);
        if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
        if (cols === 3) return 'grid-cols-1 sm:grid-cols-3';
        if (cols >= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
        return 'grid-cols-1 sm:grid-cols-3';
    };

    return (
        <div>
            <PageHeader
                title="Partidas Presupuestales"
                description="Gasto real vs. límite por unidad receptora y partida específica"
                actions={
                    <div className="flex items-center gap-2">
                        <select
                            value={anio}
                            onChange={(e) => setAnio(Number(e.target.value))}
                            className="text-[14px] font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        >
                            {anosOpts.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={load}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-brand-gold hover:text-brand-gold transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                }
            />

            {/* Resumen global */}
            <div className={`grid gap-4 mb-8 ${getGridColsClass()}`}>
                <StatSummary
                    label="Total General"
                    gastado={totalGastado}
                    limite={totalLimite}
                    pct={totalPct}
                    icon={<DollarSign size={18} strokeWidth={1.8} />}
                />
                {totalesGlobales.map((t) => (
                    <StatSummary
                        key={t.partida_especifica}
                        label={`Partida Esp. ${t.partida_especifica}`}
                        gastado={t.gastado}
                        limite={t.limite}
                        pct={t.porcentaje}
                        icon={<TrendingUp size={18} strokeWidth={1.8} />}
                    />
                ))}
                {!loading && data && partidas.length === 0 && (
                    <StatSummary
                        label="Sin registros"
                        gastado={0}
                        limite={0}
                        pct={null}
                        icon={<CheckCircle size={18} strokeWidth={1.8} />}
                    />
                )}
            </div>

            {/* Filtro */}
            <div className="mb-4 flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Buscar dependencia o clave UR…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:max-w-xs text-[14px] border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all"
                />
                <span className="text-[13px] text-zinc-400 shrink-0">
                    {rows.length} dependencia{rows.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Tabla pivot */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <RefreshCw size={16} strokeWidth={1.8} className="animate-spin" />
                            <span className="text-[14px] font-medium">Cargando datos…</span>
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <DollarSign size={28} strokeWidth={1.2} className="mb-3 opacity-30" />
                        <p className="text-[14px] font-semibold">Sin datos de partidas</p>
                        <p className="text-[13px] mt-1">Asegúrate de que concentrado y propuesta tengan registros.</p>
                    </div>
                ) : (
                    <>
                        {/* 💻 VISTA ESCRITORIO (Tabla) */}
                        <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[65vh] relative">
                            <table className="w-full text-left min-w-[600px] border-collapse">
                                <thead className="sticky top-0 z-20 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-zinc-100 dark:outline-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                            Dependencia / UR
                                        </th>
                                        {partidas.map((pe) => (
                                            <th key={pe} className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                                Partida Esp. {pe}
                                            </th>
                                        ))}
                                        {partidas.length === 0 && (
                                            <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                                Importe
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400 text-right">
                                            Límites
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => {
                                        const isLast = i === rows.length - 1;
                                        return (
                                            <tr
                                                key={row.ur}
                                                className={`${!isLast ? 'border-b border-zinc-50 dark:border-zinc-800/40' : ''} hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors`}
                                            >
                                                <td className="px-4 py-3 align-top">
                                                    <p className="text-[14px] font-extrabold text-brand-gold uppercase tracking-wide leading-none">
                                                        UR {row.ur}
                                                    </p>
                                                    <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mt-0.5 leading-snug max-w-[180px]">
                                                        {row.nombre}
                                                    </p>
                                                    {row.trabajadores > 0 && (
                                                        <p className="text-[12px] text-zinc-400 mt-0.5">
                                                            {row.trabajadores} trabajador{row.trabajadores !== 1 ? 'es' : ''}
                                                        </p>
                                                    )}
                                                </td>
                                                {row.columnas.map((col) => (
                                                    <CeldaPartida key={col.partida_especifica} col={col} />
                                                ))}
                                                {row.columnas.length === 0 && (
                                                    <td className="px-4 py-3 text-[14px] text-zinc-400">—</td>
                                                )}
                                                <td className="px-4 py-3 align-top">
                                                    <p className="text-[14px] font-bold text-zinc-700 dark:text-zinc-200 leading-none">
                                                        {fmt(row.total_gastado)}
                                                    </p>
                                                    {row.total_limite > 0 && (
                                                        <>
                                                            <p className="text-[12px] text-zinc-400 mt-0.5">
                                                                / {fmt(row.total_limite)}
                                                            </p>
                                                            <ProgressBar pct={row.total_pct} alerta={nivelAlerta(row.total_pct)} />
                                                            <div className="mt-1"><AlertaBadge pct={row.total_pct} /></div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-brand-gold hover:text-brand-gold transition-all"
                                                    >
                                                        <Edit2 size={11} strokeWidth={2} /> Límites
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {rows.length > 1 && (
                                    <tfoot className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] outline outline-1 outline-zinc-100 dark:outline-zinc-700">
                                        <tr>
                                            <td className="px-4 py-4">
                                                <p className="text-[14px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total general</p>
                                            </td>
                                            {totalesGlobales.map((t) => (
                                                <td key={t.partida_especifica} className="px-4 py-4">
                                                    <p className="text-[16px] font-bold text-zinc-700 dark:text-zinc-200">{fmt(t.gastado)}</p>
                                                    {t.limite > 0 && <p className="text-[12px] text-zinc-400">/ {fmt(t.limite)}</p>}
                                                </td>
                                            ))}
                                            {totalesGlobales.length === 0 && <td />}
                                            <td className="px-4 py-4">
                                                <p className="text-[16px] font-black text-brand-gold">{fmt(totalGastado)}</p>
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* 📱 VISTA MÓVIL (Tarjetas apiladas) */}
                        <div className="sm:hidden flex flex-col max-h-[75vh] overflow-y-auto relative">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {rows.map((row) => (
                                    <div key={row.ur} className="p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-extrabold text-brand-gold uppercase tracking-wide leading-none">UR {row.ur}</p>
                                                <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mt-1 leading-snug">{row.nombre}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(row)}
                                                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all shadow-sm"
                                            >
                                                <Edit2 size={13} strokeWidth={2.5} /> Límites
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800">
                                            {row.columnas.map((col) => {
                                                const nivel = nivelAlerta(col.porcentaje);
                                                return (
                                                    <div key={col.partida_especifica} className="flex flex-col">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 pl-1">Partida {col.partida_especifica}</p>
                                                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-3 shadow-sm flex flex-col justify-center">
                                                            <p className={`text-[14px] font-bold leading-none ${nivel === 'critico' ? 'text-red-600 dark:text-red-400' : nivel === 'alto' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                                                {fmt(col.gastado)}
                                                            </p>
                                                            {col.limite > 0 ? (
                                                                <>
                                                                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5">/ {fmt(col.limite)}</p>
                                                                    <ProgressBar pct={col.porcentaje} alerta={nivel} />
                                                                </>
                                                            ) : (
                                                                <p className="text-[11px] font-medium text-zinc-400 mt-0.5">Sin límite</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Subtotal UR */}
                                            <div className="col-span-2 mt-1 pt-3 border-t border-zinc-200 dark:border-zinc-700/60">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Gastado</p>
                                                        <p className="text-[16px] font-black text-zinc-800 dark:text-zinc-100 leading-none">{fmt(row.total_gastado)}</p>
                                                    </div>
                                                    {row.total_limite > 0 && (
                                                        <p className="text-[12px] font-medium text-zinc-400">/ {fmt(row.total_limite)}</p>
                                                    )}
                                                </div>
                                                {row.total_limite > 0 && (
                                                    <div className="mt-2.5">
                                                        <ProgressBar pct={row.total_pct} alerta={nivelAlerta(row.total_pct)} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Fila totales Móvil */}
                            {rows.length > 1 && (
                                <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800 p-5 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] outline outline-1 outline-zinc-100 dark:outline-zinc-700 space-y-4">
                                    <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">Total General (Todas las UR)</p>
                                    <div className="flex flex-wrap gap-4 justify-between">
                                        {totalesGlobales.map((t) => (
                                            <div key={t.partida_especifica}>
                                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">P. Esp {t.partida_especifica}</p>
                                                <p className="text-[15px] font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{fmt(t.gastado)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                                        <span className="text-[13px] font-black uppercase tracking-widest text-zinc-500">GRAN TOTAL</span>
                                        <span className="font-black text-brand-gold text-[18px]">{fmt(totalGastado)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
