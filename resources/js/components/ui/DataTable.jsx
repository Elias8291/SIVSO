/**
 * DataTable — responsive:
 *  - Desktop (md+): tabla horizontal clásica
 *  - Móvil (<md):  cada fila se convierte en una tarjeta
 *                  con etiqueta arriba y valor abajo por cada columna
 *
 * Props:
 *   columns      [{ key, label, render?, className?, tdClass?, hideOnMobile? }]
 *   data         array de objetos
 *   loading      boolean
 *   onEdit       (row) => void
 *   onDelete     (row) => void
 *   extraActions [{ label, icon, onClick, variant? }]
 *   emptyMessage string
 *   rowKey       string  (default 'id')
 */
export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    onEdit,
    onDelete,
    extraActions = [],
    emptyMessage = 'Sin registros.',
    rowKey = 'id',
}) {
    const hasActions = onEdit || onDelete || extraActions.length > 0;

    /* ── Spinner / vacío ─────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="py-16 text-center text-[11px] text-zinc-400">
                {emptyMessage}
            </div>
        );
    }

    /* ── Botones de acción compartidos ───────────────────────────────── */
    const ActionButtons = ({ row }) => (
        <div className="flex items-center gap-1.5 flex-wrap">
            {extraActions.map((action, ai) => (
                <button
                    key={ai}
                    type="button"
                    onClick={() => action.onClick(row)}
                    title={action.label}
                    className={`size-7 rounded-lg flex items-center justify-center text-xs transition-all
                        ${action.variant === 'danger'
                            ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600'
                            : action.variant === 'success'
                                ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                : 'text-zinc-400 hover:bg-[#AF9460]/10 hover:text-[#AF9460]'
                        }`}
                >
                    {action.icon}
                </button>
            ))}
            {onEdit && (
                <button
                    type="button"
                    onClick={() => onEdit(row)}
                    title="Editar"
                    className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-[#AF9460]/10 hover:text-[#AF9460] transition-all"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            )}
            {onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(row)}
                    title="Eliminar"
                    className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* ── DESKTOP: tabla clásica (md+) ────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 ${col.className ?? ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {hasActions && (
                                <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 text-right">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={`${row[rowKey] ?? 'row'}-${i}`}
                                className={`group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/20 ${
                                    i < data.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/40' : ''
                                }`}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-6 py-4 ${col.tdClass ?? ''}`}>
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : <span className="text-[11px] text-zinc-700 dark:text-zinc-300">{row[col.key] ?? '—'}</span>
                                        }
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionButtons row={row} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── MÓVIL: tarjetas (< md) ──────────────────────────────────── */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {data.map((row, i) => (
                    <div key={`${row[rowKey] ?? 'row'}-${i}`} className="px-4 py-4 space-y-3">
                        {/* Campos como pares etiqueta / valor */}
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                            {columns.filter(c => !c.hideOnMobile).map((col) => (
                                <div key={col.key} className={col.mobileFullWidth ? 'col-span-2' : ''}>
                                    <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-0.5">
                                        {col.label}
                                    </dt>
                                    <dd className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? '—')
                                        }
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {/* Acciones siempre visibles en móvil */}
                        {hasActions && (
                            <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-50 dark:border-zinc-800/40">
                                <ActionButtons row={row} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
