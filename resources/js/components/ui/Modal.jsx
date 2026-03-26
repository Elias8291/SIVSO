import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
};

/**
 * Modal reutilizable.
 * - Móvil (&lt; sm): hoja inferior (bottom sheet), ancho completo, altura con `dvh` y safe areas.
 * - sm+: diálogo centrado clásico.
 * @param {boolean} [mobileFloatingClose] — En móvil, título compacto y X flotante para ganar espacio al listar/editar.
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer, mobileFloatingClose = false }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                aria-label="Cerrar"
                onClick={onClose}
            />

            <div
                className={`
                    relative z-10 flex min-h-0 min-w-0 w-full flex-col overflow-hidden
                    border border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900
                    rounded-t-2xl rounded-b-none
                    max-h-[min(92dvh,100%)] sm:max-h-[min(90vh,100%)] sm:rounded-2xl
                    ${SIZES[size]}
                `}
                role="dialog"
                aria-modal="true"
                aria-label={mobileFloatingClose ? title : undefined}
                aria-labelledby={mobileFloatingClose ? undefined : 'modal-title'}
                onClick={(e) => e.stopPropagation()}
            >
                {mobileFloatingClose ? (
                    <>
                        <p
                            aria-hidden
                            className="pointer-events-none absolute left-4 right-[4.25rem] top-[max(0.85rem,env(safe-area-inset-top))] z-10 line-clamp-2 text-left text-[11px] font-bold uppercase leading-tight tracking-wider text-zinc-600 dark:text-zinc-300 sm:hidden"
                        >
                            {title}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex size-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-100 text-zinc-700 shadow-sm transition-all hover:bg-zinc-200 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 sm:hidden touch-manipulation"
                            aria-label="Cerrar"
                        >
                            <X size={22} strokeWidth={2.5} />
                        </button>
                    </>
                ) : null}

                <div
                    className={
                        mobileFloatingClose
                            ? 'hidden shrink-0 items-center justify-between gap-3 border-b border-zinc-50 px-4 py-3.5 dark:border-zinc-800/60 sm:flex sm:px-6 sm:py-4'
                            : 'flex shrink-0 items-center justify-between gap-3 border-b border-zinc-50 px-4 py-3.5 dark:border-zinc-800/60 sm:px-6 sm:py-4'
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2 pr-10 sm:pr-0">
                        <span className="size-1.5 shrink-0 rounded-full bg-brand-gold" aria-hidden />
                        <h3 id="modal-title" className="min-w-0 truncate text-base font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:text-lg">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-all hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white sm:size-9 sm:bg-transparent sm:dark:bg-transparent touch-manipulation"
                        aria-label="Cerrar"
                    >
                        <X size={20} className="sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} />
                    </button>
                </div>

                <div
                    className={
                        mobileFloatingClose
                            ? (footer
                                ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 pt-14 sm:px-6 sm:py-5 sm:pt-5'
                                : 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:py-5 sm:pt-5')
                            : (footer
                                ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5'
                                : 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]')
                    }
                >
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 border-t border-zinc-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800/60 sm:px-6 sm:py-4 sm:pb-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
