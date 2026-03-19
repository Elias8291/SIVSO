/**
 * Vista para editar límites de partidas de una UR.
 * Sustituye el modal de PartidasPage.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

const fmt = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n ?? 0);

export default function PartidasLimitePage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const row = state?.row;
    const anio = state?.anio ?? new Date().getFullYear();

    const [editVals, setEditVals] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!row) {
            navigate('/dashboard/partidas', { replace: true });
            return;
        }
        const vals = {};
        (row.columnas ?? []).forEach((c) => {
            vals[c.partida_especifica] = c.limite > 0 ? c.limite.toFixed(2) : '';
        });
        setEditVals(vals);
    }, [row, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!row) return;
        setSaving(true);
        try {
            await api.put('/api/partidas/limite', {
                ur: row.ur,
                anio,
                limites: Object.entries(editVals).map(([pe, val]) => ({
                    partida_especifica: parseInt(pe, 10),
                    limite: parseFloat(val) || 0,
                })),
            });
            navigate('/dashboard/partidas', { replace: true });
        } catch {
            /* silent */
        } finally {
            setSaving(false);
        }
    };

    if (!row) return null;

    return (
        <div className="mx-auto max-w-lg">
            <Link
                to="/dashboard/partidas"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#AF9460] mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Partidas
            </Link>

            <div className="bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                        Límites — UR {row.ur}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {row.nombre} · Año {anio}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Establece el límite de gasto para cada partida específica.
                    </p>

                    {(row.columnas ?? []).map((col) => (
                        <div key={col.partida_especifica}>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                                Partida Específica {col.partida_especifica}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-zinc-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={editVals[col.partida_especifica] ?? ''}
                                    onChange={(e) =>
                                        setEditVals((prev) => ({
                                            ...prev,
                                            [col.partida_especifica]: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-7 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 focus:border-[#AF9460]/40 transition-all touch-manipulation"
                                />
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1">
                                Gasto actual: <strong>{fmt(col.gastado)}</strong>
                                {col.limite > 0 && <> · Límite anterior: {fmt(col.limite)}</>}
                            </p>
                        </div>
                    ))}

                    {(row.columnas ?? []).length === 0 && (
                        <p className="text-sm text-zinc-400 text-center py-6">
                            Esta UR no tiene partidas con gasto registrado aún.
                        </p>
                    )}

                    {(row.columnas ?? []).length > 0 && (
                        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                            <Link
                                to="/dashboard/partidas"
                                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all touch-manipulation"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all touch-manipulation"
                            >
                                {saving && <RefreshCw size={14} className="animate-spin" strokeWidth={2} />}
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
