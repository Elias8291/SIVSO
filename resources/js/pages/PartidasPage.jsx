import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, Edit2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/ui';

const fmt = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n ?? 0);

const fmtNum = (n) =>
    new Intl.NumberFormat('es-MX').format(n ?? 0);

const fmtCompact = (n) => {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return fmt(n);
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

function StatSummary({ label, gastado, gastadoIva, cantidad, limite, pct, icon }) {
    const nivel = nivelAlerta(pct);
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-center shrink-0 text-brand-gold">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">{label}</p>
                <p className="text-[18px] font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">
                    {fmtCompact(gastado)} <span className="text-[11px] font-medium text-zinc-400">s/IVA</span>
                </p>
                <p className="text-[15px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none">
                    {fmtCompact(gastadoIva)} <span className="text-[10px] font-medium opacity-70">c/IVA</span>
                </p>
                {cantidad > 0 && (
                    <p className="text-[11px] text-zinc-400 mt-1">{fmtNum(cantidad)} piezas</p>
                )}
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
            <div className="min-w-[150px]">
                <p className={`text-[14px] font-bold leading-none ${nivel === 'critico' ? 'text-red-600 dark:text-red-400'
                    : nivel === 'alto' ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}>{fmt(col.gastado)}</p>
                <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {fmt(col.gastado_iva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span>
                </p>

                <p className="text-[11px] text-zinc-400 mt-0.5">
                    {fmtNum(col.cantidad)} pzas
                </p>

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
                ) : null}
            </div>
        </td>
    );
}

export default function PartidasPage() {
    const { can } = useAuth();
    const canEditLimites = can('editar_partidas');
    const [anio, setAnio] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const load = useCallback(async (anioParam) => {
        setLoading(true);
        try {
            const url = anioParam ? `/api/partidas?anio=${anioParam}` : '/api/partidas';
            const res = await fetch(url, { credentials: 'include' });
            const json = await res.json();
            setData(json);
            if (!anioParam && json.anio) setAnio(json.anio);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAnioChange = (newAnio) => {
        setAnio(newAnio);
        load(newAnio);
    };

    const rows = (data?.rows ?? []).filter((r) =>
        r.ur.toLowerCase().includes(search.toLowerCase()) ||
        r.nombre.toLowerCase().includes(search.toLowerCase())
    );

    const partidas = data?.partidas ?? [];

    const openEdit = (row) => {
        navigate('/dashboard/partidas/limites/editar', { state: { row, anio: anio ?? data?.anio } });
    };

    // Totales calculados desde las filas visibles (filtra correctamente con búsqueda)
    const { sumByPartida, totalGastado, totalGastadoIva, totalPiezas, totalLimite } = useMemo(() => {
        const byPart = {};
        let tGastado = 0;
        let tGastadoIva = 0;
        let tPiezas = 0;
        let tLimite = 0;

        for (const row of rows) {
            for (const col of row.columnas) {
                const pa = col.partida_especifica;
                if (!byPart[pa]) byPart[pa] = { gastado: 0, gastado_iva: 0, cantidad: 0, limite: 0 };
                byPart[pa].gastado += col.gastado;
                byPart[pa].gastado_iva += col.gastado_iva ?? 0;
                byPart[pa].cantidad += col.cantidad;
                byPart[pa].limite += col.limite;
            }
            tGastado += row.total_gastado;
            tGastadoIva += row.total_gastado_iva ?? 0;
            tPiezas += row.total_piezas ?? 0;
            tLimite += row.total_limite;
        }

        return { sumByPartida: byPart, totalGastado: tGastado, totalGastadoIva: tGastadoIva, totalPiezas: tPiezas, totalLimite: tLimite };
    }, [rows]);

    const totalPct = totalLimite > 0 ? Math.min(Math.round((totalGastado / totalLimite) * 100), 999) : null;

    const aniosDisponibles = data?.anios_disponibles ?? [];
    const anioActual = new Date().getFullYear();
    const anosOpts = aniosDisponibles.length > 0
        ? [...new Set([...aniosDisponibles, anioActual])].sort()
        : [anioActual - 1, anioActual, anioActual + 1];

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
                description={`Gasto por partida · Ejercicio ${anio ?? data?.anio ?? anioActual} · ${fmtNum(totalPiezas)} piezas · ${rows.length} dependencias`}
                actions={
                    <div className="flex items-center gap-2">
                        <select
                            value={anio ?? data?.anio ?? anioActual}
                            onChange={(e) => handleAnioChange(Number(e.target.value))}
                            className="text-[14px] font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        >
                            {anosOpts.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => load(anio)}
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
                    gastadoIva={totalGastadoIva}
                    cantidad={totalPiezas}
                    limite={totalLimite}
                    pct={totalPct}
                    icon={<DollarSign size={18} strokeWidth={1.8} />}
                />
                {partidas.map((pa) => {
                    const s = sumByPartida[pa] ?? { gastado: 0, gastado_iva: 0, cantidad: 0, limite: 0 };
                    return (
                        <StatSummary
                            key={pa}
                            label={`Partida ${pa}`}
                            gastado={s.gastado}
                            gastadoIva={s.gastado_iva}
                            cantidad={s.cantidad}
                            limite={s.limite}
                            pct={s.limite > 0 ? Math.round((s.gastado / s.limite) * 100) : null}
                            icon={<TrendingUp size={18} strokeWidth={1.8} />}
                        />
                    );
                })}
                {!loading && data && partidas.length === 0 && (
                    <StatSummary
                        label="Sin registros"
                        gastado={0}
                        cantidad={0}
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
                        <p className="text-[13px] mt-1">No hay selecciones registradas para este ejercicio.</p>
                    </div>
                ) : (
                    <>
                        {/* VISTA ESCRITORIO */}
                        <div className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[65vh] relative">
                            <table className="w-full text-left min-w-[600px] border-collapse">
                                <thead className="sticky top-0 z-20 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-zinc-100 dark:outline-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                            Dependencia / UR
                                        </th>
                                        {partidas.map((pe) => (
                                            <th key={pe} className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                                Partida {pe}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                            Total
                                        </th>
                                        {canEditLimites && (
                                            <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-400 text-right">
                                                Acciones
                                            </th>
                                        )}
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
                                                    <p className="text-[12px] text-zinc-400 mt-0.5">
                                                        {row.trabajadores} trab. · {fmtNum(row.total_piezas ?? 0)} pzas
                                                    </p>
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
                                                    <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        {fmt(row.total_gastado_iva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span>
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                                        {fmtNum(row.total_piezas ?? 0)} pzas
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
                                                {canEditLimites && (
                                                    <td className="px-4 py-3 align-top text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(row)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-brand-gold hover:text-brand-gold transition-all"
                                                        >
                                                            <Edit2 size={11} strokeWidth={2} /> Límites
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {rows.length > 1 && (
                                    <tfoot className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] outline outline-1 outline-zinc-100 dark:outline-zinc-700">
                                        <tr>
                                            <td className="px-4 py-4">
                                                <p className="text-[14px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">{rows.length} dependencias</p>
                                            </td>
                                            {partidas.map((pa) => {
                                                const s = sumByPartida[pa] ?? { gastado: 0, gastado_iva: 0, cantidad: 0 };
                                                return (
                                                    <td key={pa} className="px-4 py-4">
                                                        <p className="text-[16px] font-bold text-zinc-700 dark:text-zinc-200">{fmt(s.gastado)}</p>
                                                        <p className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{fmt(s.gastado_iva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span></p>
                                                        <p className="text-[11px] text-zinc-400 mt-0.5">{fmtNum(s.cantidad)} pzas</p>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-4">
                                                <p className="text-[16px] font-black text-brand-gold">{fmt(totalGastado)}</p>
                                                <p className="text-[14px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">{fmt(totalGastadoIva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span></p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">{fmtNum(totalPiezas)} pzas</p>
                                            </td>
                                            {canEditLimites && <td />}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* VISTA MOVIL */}
                        <div className="sm:hidden flex flex-col max-h-[75vh] overflow-y-auto relative">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {rows.map((row) => (
                                    <div key={row.ur} className="p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-extrabold text-brand-gold uppercase tracking-wide leading-none">UR {row.ur}</p>
                                                <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mt-1 leading-snug">{row.nombre}</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">{row.trabajadores} trab. · {fmtNum(row.total_piezas ?? 0)} pzas</p>
                                            </div>
                                            {canEditLimites && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(row)}
                                                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <Edit2 size={13} strokeWidth={2.5} /> Límites
                                                </button>
                                            )}
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
                                                            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                                {fmt(col.gastado_iva)} <span className="text-[9px] font-normal opacity-70">c/IVA</span>
                                                            </p>
                                                            <p className="text-[11px] text-zinc-400 mt-0.5">{fmtNum(col.cantidad)} pzas</p>
                                                            {col.limite > 0 && (
                                                                <>
                                                                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5">/ {fmt(col.limite)}</p>
                                                                    <ProgressBar pct={col.porcentaje} alerta={nivel} />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="col-span-2 mt-1 pt-3 border-t border-zinc-200 dark:border-zinc-700/60">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Gastado</p>
                                                        <p className="text-[16px] font-black text-zinc-800 dark:text-zinc-100 leading-none">{fmt(row.total_gastado)}</p>
                                                        <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            {fmt(row.total_gastado_iva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span>
                                                        </p>
                                                        <p className="text-[11px] text-zinc-400 mt-0.5">{fmtNum(row.total_piezas ?? 0)} piezas</p>
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

                            {rows.length > 1 && (
                                <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800 p-5 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] outline outline-1 outline-zinc-100 dark:outline-zinc-700 space-y-4">
                                    <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">Total General ({rows.length} UR)</p>
                                    <div className="flex flex-wrap gap-4 justify-between">
                                        {partidas.map((pa) => {
                                            const s = sumByPartida[pa] ?? { gastado: 0, gastado_iva: 0, cantidad: 0 };
                                            return (
                                                <div key={pa}>
                                                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Partida {pa}</p>
                                                    <p className="text-[15px] font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{fmt(s.gastado)}</p>
                                                    <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">{fmt(s.gastado_iva)} <span className="text-[9px] opacity-70">c/IVA</span></p>
                                                    <p className="text-[10px] text-zinc-400">{fmtNum(s.cantidad)} pzas</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-end">
                                        <div>
                                            <span className="text-[13px] font-black uppercase tracking-widest text-zinc-500">GRAN TOTAL</span>
                                            <p className="text-[10px] text-zinc-400">{fmtNum(totalPiezas)} piezas</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-brand-gold text-[18px]">{fmt(totalGastado)}</span>
                                            <p className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">{fmt(totalGastadoIva)} <span className="text-[10px] font-normal opacity-70">c/IVA</span></p>
                                        </div>
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
