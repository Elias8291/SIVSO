import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

/**
 * Diálogo de confirmación para acciones destructivas.
 */
export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title   = '¿Confirmar acción?',
    message = 'Esta acción no se puede deshacer.',
    confirmLabel = 'Eliminar',
    loading = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                        {loading && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="flex gap-4 items-start">
                <div className="shrink-0 size-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-500" strokeWidth={2} />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1.5">
                    {message}
                </p>
            </div>
        </Modal>
    );
}
