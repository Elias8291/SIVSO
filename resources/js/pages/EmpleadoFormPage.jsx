/**
 * Vista para crear o editar un Empleado.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, ChevronDown, UserPlus, Key } from 'lucide-react';
import { api } from '../lib/api';
import { Modal, PageHeader, Card, SearchInput } from '../components/ui';

function Field({ label, error, children }) {
    return (
        <div className="w-full space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

const EMPTY_FORM = {
    nue: '', nombre: '', apellido_paterno: '', apellido_materno: '',
    dependencia_clave: '', delegacion_clave: '', activo: true, user_id: '',
};

const EMPTY_CREAR_USUARIO = {
    name: '',
    rfc: '',
    email: '',
    password: '',
    password_confirmation: '',
};

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";
const selectClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all appearance-none pr-10 cursor-pointer touch-manipulation";

export default function EmpleadoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [dependencias, setDependencias] = useState([]);
    const [delegaciones, setDelegaciones] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userLinked, setUserLinked] = useState(null);
    const userSearchTimer = useRef(null);

    const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
    const [crearUsuarioForm, setCrearUsuarioForm] = useState(EMPTY_CREAR_USUARIO);
    const [errorsCrearUsuario, setErrorsCrearUsuario] = useState({});
    const [savingCrearUsuario, setSavingCrearUsuario] = useState(false);
    /** Valores al cargar edición: para avisos de vestuario / presupuesto UR. */
    const [ubicacionInicial, setUbicacionInicial] = useState({ ur: '', delegacion: '' });

    const nombreCompleto = useMemo(() =>
        [form.nombre, form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ').trim(),
    [form.nombre, form.apellido_paterno, form.apellido_materno]);

    /** Alineado con `App\Support\VestuarioReglasUbicacion` (vestuario / presupuesto por UR). */
    const avisoVestuarioUbicacion = useMemo(() => {
        const urForm = (form.dependencia_clave ?? '').trim();
        const delForm = (form.delegacion_clave ?? '').trim();
        if (!isEdit) {
            return 'Los nuevos ingresos reciben su asignación de recurso para vestuario en la UR elegida; al seleccionar productos en el periodo autorizado, ese importe se suma al gasto consolidado de esa unidad responsable.';
        }
        const urIni = (ubicacionInicial.ur ?? '').trim();
        const delIni = (ubicacionInicial.delegacion ?? '').trim();
        if (urForm === '' && delForm === '') return null;
        if (urIni !== '' && urForm !== '' && urIni !== urForm) {
            return 'Si pasa a otra unidad responsable (distinta UR), el vestuario corresponde al contexto de la nueva UR: debe contar con la asignación y la selección de productos en la nueva delegación. El gasto dejará de reflejarse en la UR anterior y pasará a la nueva según sus selecciones, aumentando el total gastado en esa UR en la medida de su importe.';
        }
        if (urIni !== '' && urForm !== '' && urIni === urForm && delIni !== '' && delForm !== '' && delIni !== delForm) {
            return 'Si solo cambia la delegación dentro de la misma UR, el colaborador conserva el mismo marco de presupuesto de vestuario respecto a su asignación ya registrada: no se genera un recurso adicional en la UR por el traslado. Deberá revisar o ajustar su vestuario según la nueva delegación; el gasto de la UR sigue contabilizándose en conjunto para quienes pertenecen a esa unidad.';
        }
        return null;
    }, [isEdit, form.dependencia_clave, form.delegacion_clave, ubicacionInicial.ur, ubicacionInicial.delegacion]);

    useEffect(() => {
        api.get('/api/dependencias?search=').then(r => setDependencias(r.data ?? [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!form.dependencia_clave) { setDelegaciones([]); return; }
        api.get(`/api/delegaciones?ur=${form.dependencia_clave}`)
            .then(r => setDelegaciones(r.data ?? [])).catch(() => { });
    }, [form.dependencia_clave]);

    useEffect(() => {
        clearTimeout(userSearchTimer.current);
        if (!userSearch.trim()) { setUserResults([]); return; }
        userSearchTimer.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(userSearch)}&per_page=8`)
                .then(r => setUserResults(r.data ?? [])).catch(() => { });
        }, 350);
        return () => clearTimeout(userSearchTimer.current);
    }, [userSearch]);

    useEffect(() => {
        if (!isEdit) return;
        api.get(`/api/empleados/${id}`)
            .then((res) => {
                const e = res.data ?? res;
                if (e) {
                    const ur = e.dependencia_clave ?? '';
                    const del = e.delegacion_clave ?? '';
                    setUbicacionInicial({ ur, delegacion: del });
                    setForm({
                        nue: e.nue ?? '',
                        nombre: e.nombre ?? '',
                        apellido_paterno: e.apellido_paterno ?? '',
                        apellido_materno: e.apellido_materno ?? '',
                        dependencia_clave: ur,
                        delegacion_clave: del,
                        activo: true,
                        user_id: e.user_id ?? '',
                    });
                    if (e.usuario) {
                        setUserLinked({
                            id: e.usuario.id,
                            name: e.usuario.name,
                            rfc: e.usuario.rfc,
                        });
                    } else {
                        setUserLinked(null);
                    }
                } else {
                    navigate('/dashboard/empleados', { replace: true });
                }
            })
            .catch(() => navigate('/dashboard/empleados', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const resetUserSearch = () => { setUserSearch(''); setUserResults([]); };

    const abrirModalCrearUsuario = () => {
        setCrearUsuarioForm({
            ...EMPTY_CREAR_USUARIO,
            name: nombreCompleto || '',
            rfc: '',
        });
        setErrorsCrearUsuario({});
        setModalCrearUsuario(true);
    };

    const handleCrearUsuario = async (e) => {
        e.preventDefault();
        if (!isEdit) return;
        setSavingCrearUsuario(true);
        setErrorsCrearUsuario({});
        try {
            const res = await api.post(`/api/empleados/${id}/crear-usuario`, crearUsuarioForm);
            const u = res.user ?? res;
            if (u?.id) {
                setUserLinked({ id: u.id, name: u.name, rfc: u.rfc });
                setForm((p) => ({ ...p, user_id: u.id }));
            }
            setModalCrearUsuario(false);
            setCrearUsuarioForm(EMPTY_CREAR_USUARIO);
        } catch (err) {
            setErrorsCrearUsuario(err.errors ?? { general: [err.message] });
        } finally {
            setSavingCrearUsuario(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = { ...form, user_id: form.user_id || null };
            if (isEdit) {
                await api.put(`/api/empleados/${id}`, payload);
            } else {
                await api.post('/api/empleados', payload);
            }
            navigate('/dashboard/empleados', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-2">
            <Link
                to="/dashboard/empleados"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Empleados
            </Link>

            <PageHeader
                title={isEdit ? 'Editar colaborador' : 'Nuevo colaborador'}
                description="Datos del padrón, unidad responsable, delegación y vínculo de usuario."
            />

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {errors.general && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        <X size={18} strokeWidth={2} className="shrink-0 mt-0.5" aria-hidden />
                        <span>{errors.general}</span>
                    </div>
                )}

                <Card title="Identidad personal">
                    <div className="p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                            <div className="md:col-span-1">
                                <Field label="NUE" error={errors.nue?.[0]}>
                                    <input type="text" value={form.nue} onChange={f('nue')} placeholder="Número único" maxLength={15} required className={inputClass} />
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Field label="Nombre(s)" error={errors.nombre?.[0]}>
                                    <input type="text" value={form.nombre} onChange={f('nombre')} placeholder="Nombre(s)" maxLength={80} required className={inputClass} />
                                </Field>
                            </div>
                            <div className="md:col-span-1">
                                <Field label="Apellido paterno" error={errors.apellido_paterno?.[0]}>
                                    <input type="text" value={form.apellido_paterno} onChange={f('apellido_paterno')} placeholder="Opcional" maxLength={80} className={inputClass} />
                                </Field>
                            </div>
                            <div className="md:col-span-1">
                                <Field label="Apellido materno" error={errors.apellido_materno?.[0]}>
                                    <input type="text" value={form.apellido_materno} onChange={f('apellido_materno')} placeholder="Opcional" maxLength={80} className={inputClass} />
                                </Field>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Asignación organizacional">
                    <div className="p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                            <Field label="Unidad responsable (UR)" error={errors.dependencia_clave?.[0]}>
                                <div className="relative">
                                    <select value={form.dependencia_clave} onChange={(e) => setForm(p => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))} required className={selectClass}>
                                        <option value="">Seleccione UR…</option>
                                        {dependencias.map(d => <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2} />
                                </div>
                            </Field>

                            <Field label="Delegación" error={errors.delegacion_clave?.[0]}>
                                <div className="relative">
                                    <select value={form.delegacion_clave} onChange={f('delegacion_clave')} disabled={!form.dependencia_clave} required className={`${selectClass} ${!form.dependencia_clave ? 'opacity-50' : ''}`}>
                                        <option value="">Seleccione delegación…</option>
                                        {delegaciones.map(d => <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2} />
                                </div>
                            </Field>
                        </div>

                        {avisoVestuarioUbicacion && (
                            <div
                                className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-4 py-3 text-[12px] leading-relaxed text-zinc-700 dark:border-zinc-600/80 dark:bg-zinc-800/40 dark:text-zinc-300"
                                role="note"
                            >
                                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    Vestuario y presupuesto (UR)
                                </p>
                                <p className="mt-1.5">{avisoVestuarioUbicacion}</p>
                            </div>
                        )}

                        <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors min-h-[52px]">
                            <div>
                                <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Colaborador activo</span>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Inactivo oculta el registro en listados operativos.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form.activo}
                                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                                className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${form.activo ? 'bg-brand-gold' : 'bg-zinc-200 dark:bg-zinc-600'}`}
                            >
                                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${form.activo ? 'left-5' : 'left-0.5'}`} />
                            </button>
                        </label>
                    </div>
                </Card>

                <Card title="Cuenta de sistema">
                    <div className="p-5 sm:p-6 space-y-5">
                        <Field label="Usuario vinculado (opcional)" error={errors.user_id?.[0]}>
                            {userLinked ? (
                                <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                                            <Key size={18} strokeWidth={2} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{userLinked.name}</p>
                                            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">RFC {userLinked.rfc}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }}
                                        className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 touch-manipulation"
                                    >
                                        Desvincular
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <SearchInput
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Nombre o RFC…"
                                        inputClassName="text-base sm:text-sm"
                                    />
                                    {userResults.length > 0 && (
                                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {userResults.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }}
                                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
                                                >
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{u.name}</span>
                                                    <span className="text-[11px] font-mono text-zinc-500 shrink-0">{u.rfc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {userSearch && userResults.length === 0 && (
                                        <p className="text-[12px] text-zinc-500">Sin coincidencias.</p>
                                    )}
                                </div>
                            )}
                        </Field>

                        {isEdit && !userLinked && (
                            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-brand-gold/35 bg-brand-gold/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                    Cree una cuenta nueva con RFC y contraseña para que este colaborador acceda al sistema.
                                </p>
                                <button
                                    type="button"
                                    onClick={abrirModalCrearUsuario}
                                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-brand-gold/40 bg-brand-gold/10 text-[12px] font-bold text-brand-gold hover:bg-brand-gold/15 transition-colors touch-manipulation shrink-0"
                                >
                                    <UserPlus size={16} strokeWidth={2.2} />
                                    Nuevo usuario
                                </button>
                            </div>
                        )}
                        {!isEdit && (
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Guarde el colaborador primero; luego podrá vincular o crear usuario desde la edición.
                            </p>
                        )}
                    </div>
                </Card>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:items-center">
                    <Link
                        to="/dashboard/empleados"
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-auto touch-manipulation"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto min-w-[10rem] touch-manipulation"
                    >
                        {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar colaborador'}
                    </button>
                </div>
            </form>

            <Modal
                open={modalCrearUsuario}
                onClose={() => !savingCrearUsuario && setModalCrearUsuario(false)}
                title="Nuevo usuario"
                size="2xl"
                footer={
                    <div className="flex justify-end gap-2 w-full pt-1">
                        <button
                            type="button"
                            disabled={savingCrearUsuario}
                            onClick={() => setModalCrearUsuario(false)}
                            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-[14px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-crear-usuario-empleado"
                            disabled={savingCrearUsuario}
                            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[14px] font-bold shadow-md shadow-zinc-900/10 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all touch-manipulation"
                        >
                            {savingCrearUsuario ? 'Creando…' : 'Crear y vincular'}
                        </button>
                    </div>
                }
            >
                <form id="form-crear-usuario-empleado" onSubmit={handleCrearUsuario} className="space-y-5">
                    {errorsCrearUsuario.general && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/50">
                            {Array.isArray(errorsCrearUsuario.general) ? errorsCrearUsuario.general[0] : errorsCrearUsuario.general}
                        </p>
                    )}
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        El <strong className="text-zinc-800 dark:text-zinc-200">RFC</strong> será el usuario de acceso. Defina una contraseña segura (mínimo 8 caracteres).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre para la cuenta" error={errorsCrearUsuario.name?.[0]}>
                            <input
                                type="text"
                                value={crearUsuarioForm.name}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Nombre completo"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="RFC (usuario de acceso)" error={errorsCrearUsuario.rfc?.[0]}>
                            <input
                                type="text"
                                value={crearUsuarioForm.rfc}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                                placeholder="Ej. ABCD123456EF7"
                                maxLength={20}
                                required
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field label="Correo electrónico (opcional)" error={errorsCrearUsuario.email?.[0]}>
                        <input
                            type="email"
                            value={crearUsuarioForm.email}
                            onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="correo@institucion.gob.mx"
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Contraseña" error={errorsCrearUsuario.password?.[0]}>
                            <input
                                type="password"
                                value={crearUsuarioForm.password}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, password: e.target.value }))}
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Confirmar contraseña" error={errorsCrearUsuario.password_confirmation?.[0]}>
                            <input
                                type="password"
                                value={crearUsuarioForm.password_confirmation}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                                placeholder="Repetir contraseña"
                                autoComplete="new-password"
                                required
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
