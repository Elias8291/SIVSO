import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
};

/**
 * Modal reutilizable con overlay, cierre por Escape y trap de scroll.
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Panel */}
            <div className={`relative bg-white dark:bg-[#0F0F10] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl w-full ${SIZES[size]} flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50 dark:border-zinc-800/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="size-1.5 bg-[#AF9460] rounded-full" />
                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                        <X size={14} strokeWidth={2} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-zinc-50 dark:border-zinc-800/60 flex items-center justify-end gap-2.5 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
