import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui';

/**
 * Alta de usuario desde Mi delegación: contraseña inicial = últimos 8 caracteres del RFC; el sistema exige cambio al entrar.
 */
export default function CrearUsuarioEmpleadoModal({ empleado, delegacionId, onClose, onCreated }) {
    const [rfc, setRfc] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (empleado) {
            setRfc('');
            setEmail('');
            setError(null);
        }
    }, [empleado]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await api.post(`/api/mi-delegacion/empleados/${empleado.id}/crear-usuario`, {
                rfc: rfc.trim(),
                email: email.trim() || null,
            });
            onCreated?.(res, {
                empleadoId: empleado.id,
                delegacionId,
            });
            onClose?.();
        } catch (err) {
            setError(err.message || 'No se pudo crear el usuario.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!empleado) return null;

    return (
        <Modal
            open={!!empleado}
            onClose={onClose}
            title="Crear acceso al sistema"
            size="sm"
            footer={
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="form-crear-usuario-delegacion"
                        disabled={submitting || !rfc.trim()}
                        className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50"
                    >
                        {submitting ? 'Creando…' : 'Crear usuario'}
                    </button>
                </div>
            }
        >
            <form id="form-crear-usuario-delegacion" onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/40">
                    <UserPlus size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                        La contraseña inicial serán los <strong>últimos 8 caracteres</strong> del RFC que capture (letras y números).
                        En el primer inicio de sesión el sistema <strong>pedirá cambiar la contraseña</strong> antes de usar el portal.
                    </p>
                </div>

                <div>
                    <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{empleado.nombre_completo}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">NUE: {empleado.nue}</p>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[12px] text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">RFC del colaborador *</label>
                    <input
                        type="text"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        maxLength={20}
                        autoComplete="off"
                        placeholder="Ej. XAXX010101ABC"
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono uppercase"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correo (opcional)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        placeholder="correo@institucion.gob.mx"
                    />
                </div>
            </form>
        </Modal>
    );
}
