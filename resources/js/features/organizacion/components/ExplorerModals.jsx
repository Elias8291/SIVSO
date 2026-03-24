/**
 * Modales de Dependencia, Delegado y Confirmación.
 */
import { Modal, ConfirmDialog } from '../../../components/ui';
import { api } from '../../../lib/api';
import ExplorerInput from './ExplorerInput';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            {children}
            {error && <p className="text-[10px] text-red-500">{error}</p>}
        </div>
    );
}

function ErrMsg({ msg }) {
    return (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{msg}</p>
    );
}

function ModalFooter({ onCancel, form, saving, label }) {
    return (
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
            <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] py-2.5 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
            >
                Cancelar
            </button>
            <button
                type="submit"
                form={form}
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold disabled:opacity-60 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
            >
                {saving && (
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {label}
            </button>
        </div>
    );
}

export function DependenciaModal({
    open,
    onClose,
    mode,
    item,
    form,
    setForm,
    formErrors,
    setFormErrors,
    saving,
    setSaving,
    onSuccess,
}) {
    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormErrors({});
        try {
            if (mode === 'create') {
                await api.post('/api/dependencias', form);
            } else {
                await api.put(`/api/dependencias/${item.id}`, form);
            }
            onClose();
            onSuccess();
        } catch (err) {
            setFormErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={mode === 'create' ? 'Nueva Dependencia' : 'Editar Dependencia'}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    form="form-dep"
                    saving={saving}
                    label={mode === 'create' ? 'Crear' : 'Guardar'}
                />
            }
        >
            <form id="form-dep" onSubmit={save} className="space-y-4">
                {formErrors.general && <ErrMsg msg={formErrors.general} />}
                <Field label="Clave UR (máx. 5 caracteres)" error={formErrors.clave?.[0]}>
                    <ExplorerInput
                        value={form.clave}
                        onChange={(v) => setForm({ ...form, clave: v.toUpperCase() })}
                        placeholder="Ej. 3, 12, IMSS"
                        maxLength={5}
                        required
                    />
                </Field>
                <Field label="Nombre de la dependencia" error={formErrors.nombre?.[0]}>
                    <ExplorerInput
                        value={form.nombre}
                        onChange={(v) => setForm({ ...form, nombre: v })}
                        placeholder="Nombre completo"
                        required
                    />
                </Field>
            </form>
        </Modal>
    );
}

export function DelegadoModal({
    open,
    onClose,
    mode,
    item,
    form,
    setForm,
    formErrors,
    setFormErrors,
    saving,
    setSaving,
    selDep,
    onSuccess,
}) {
    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormErrors({});
        try {
            if (mode === 'create') {
                await api.post('/api/delegados', { ...form, ur: selDep.clave });
            } else {
                await api.put(`/api/delegados/${item.id}`, form);
            }
            onClose();
            onSuccess();
        } catch (err) {
            setFormErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={mode === 'create' ? `Nuevo Delegado — UR ${selDep?.clave}` : 'Editar Delegado'}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    form="form-del"
                    saving={saving}
                    label={mode === 'create' ? 'Crear' : 'Guardar'}
                />
            }
        >
            <form id="form-del" onSubmit={save} className="space-y-4">
                {formErrors.general && <ErrMsg msg={formErrors.general} />}
                <Field label="Código de delegación (sin guión)" error={formErrors.delegacion?.[0]}>
                    <ExplorerInput
                        value={form.delegacion}
                        onChange={(v) => setForm({ ...form, delegacion: v.toUpperCase() })}
                        placeholder="Ej. 3B101"
                        maxLength={25}
                        required
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                        Corresponde al código sin guión de la tabla de trabajadores (ej: 3B-101 → 3B101)
                    </p>
                </Field>
            </form>
        </Modal>
    );
}

export function ConfirmDeleteModal({ open, onClose, type, item, onConfirm, saving }) {
    const title = type === 'dep' ? 'Eliminar Dependencia' : 'Eliminar Delegado';
    const message =
        type === 'dep'
            ? `¿Eliminar la dependencia UR "${item?.clave}"? Solo es posible si no tiene delegados ni trabajadores.`
            : `¿Eliminar el registro de delegación "${item?.clave ?? item?.nombre ?? '—'}"?`;

    return (
        <ConfirmDialog
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            loading={saving}
            title={title}
            message={message}
        />
    );
}
