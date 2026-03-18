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
            <div className="py-12 text-center text-sm text-zinc-400">
                {emptyMessage}
            </div>
        );
    }

    /* ── Botones de acción compartidos ───────────────────────────────── */
    const ActionButtons = ({ row }) => (
        <div className="flex items-center justify-end gap-1.5 flex-nowrap shrink-0">
            {extraActions.map((action, ai) => (
                <button
                    key={ai}
                    type="button"
                    onClick={() => action.onClick(row)}
                    title={action.label}
                    className={`size-7 shrink-0 rounded-lg flex items-center justify-center text-xs transition-all
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
                    className="size-7 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-[#AF9460]/10 hover:text-[#AF9460] transition-all"
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
                    className="size-7 shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
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
            <div className="hidden md:block overflow-x-auto -mx-1">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-700/60">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 ${col.className ?? ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {hasActions && (
                                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 text-right w-24">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={`${row[rowKey] ?? 'row'}-${i}`}
                                className={`group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 ${
                                    i < data.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/30' : ''
                                }`}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-5 py-3 text-[13px] ${col.tdClass ?? ''}`}>
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : <span className="text-zinc-700 dark:text-zinc-300">{row[col.key] ?? '—'}</span>
                                        }
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
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
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {data.map((row, i) => (
                    <div key={`${row[rowKey] ?? 'row'}-${i}`} className="px-4 py-3 space-y-2.5">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {columns.filter(c => !c.hideOnMobile).map((col) => (
                                <div key={col.key} className={col.mobileFullWidth ? 'col-span-2' : ''}>
                                    <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-500 mb-0.5">
                                        {col.label}
                                    </dt>
                                    <dd className="text-[13px] text-zinc-700 dark:text-zinc-300">
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
