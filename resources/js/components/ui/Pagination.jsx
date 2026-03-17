import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paginador minimalista.
 *
 * @param {object} meta     - { current_page, last_page, total, from, to }
 * @param {function} onPage - (pageNumber) => void
 */
export default function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;

    const { current_page: current, last_page: last, total, from, to } = meta;

    // Genera el rango de páginas visibles con ellipsis
    const range = buildRange(current, last);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-t border-zinc-50 dark:border-zinc-800/60">

            {/* Info */}
            <p className="text-[10px] text-zinc-400 whitespace-nowrap">
                Mostrando{' '}
                <span className="font-bold text-zinc-600 dark:text-zinc-300">{from}–{to}</span>
                {' '}de{' '}
                <span className="font-bold text-zinc-600 dark:text-zinc-300">{total}</span>
                {' '}registros
            </p>

            {/* Controles */}
            <div className="flex items-center gap-1">
                {/* Anterior */}
                <PageBtn
                    onClick={() => onPage(current - 1)}
                    disabled={current === 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={13} strokeWidth={2.5} />
                </PageBtn>

                {/* Números */}
                {range.map((item, i) =>
                    item === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-zinc-400 select-none">
                            …
                        </span>
                    ) : (
                        <PageBtn
                            key={item}
                            onClick={() => onPage(item)}
                            active={item === current}
                        >
                            {item}
                        </PageBtn>
                    )
                )}

                {/* Siguiente */}
                <PageBtn
                    onClick={() => onPage(current + 1)}
                    disabled={current === last}
                    aria-label="Página siguiente"
                >
                    <ChevronRight size={13} strokeWidth={2.5} />
                </PageBtn>
            </div>
        </div>
    );
}

function PageBtn({ onClick, disabled, active, children, ...props }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            {...props}
            className={`min-w-[30px] h-[30px] px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center
                ${active
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : disabled
                        ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
        >
            {children}
        </button>
    );
}

/** Construye el array de páginas con ellipsis */
function buildRange(current, last) {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const pages = new Set([1, last, current]);
    if (current > 1) pages.add(current - 1);
    if (current < last) pages.add(current + 1);

    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];

    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
        result.push(sorted[i]);
    }

    return result;
}
