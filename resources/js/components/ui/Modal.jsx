import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
};

/**
 * Modal reutilizable. Móvil: full width, poco margen, botones táctiles.
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
    const overlayRef = useRef(null);

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
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className={`relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl w-full ${SIZES[size]} flex flex-col max-h-[85vh] sm:max-h-[90vh]`}>
                <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-zinc-50 dark:border-zinc-800/60 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="size-1.5 bg-brand-gold rounded-full shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-10 sm:size-9 shrink-0 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 sm:bg-transparent sm:dark:bg-transparent hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all touch-manipulation ml-2"
                        aria-label="Cerrar"
                    >
                        <X size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 min-h-0">
                    {children}
                </div>

                {footer && (
                    <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-zinc-50 dark:border-zinc-800/60 shrink-0 ">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
