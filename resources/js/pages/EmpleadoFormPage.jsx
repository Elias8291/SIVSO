/**
 * Vista para crear o editar un Empleado.
 * Diseño formal, adaptable a móvil.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, X, ChevronDown, UserPlus, UserCheck, Briefcase, Key, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Modal } from '../components/ui';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">
                {label}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-500 pl-1">{error}</p>}
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

const inputClass = "w-full px-4 py-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/40 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-brand-gold/40 focus:ring-1 focus:ring-brand-gold/40 transition-all shadow-sm touch-manipulation";
const selectClass = "w-full pl-4 pr-10 py-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/40 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-brand-gold/40 focus:ring-1 focus:ring-brand-gold/40 transition-all shadow-sm appearance-none touch-manipulation cursor-pointer";

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

    const nombreCompleto = useMemo(() =>
        [form.nombre, form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ').trim(),
    [form.nombre, form.apellido_paterno, form.apellido_materno]);

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
                    setForm({
                        nue: e.nue ?? '',
                        nombre: e.nombre ?? '',
                        apellido_paterno: e.apellido_paterno ?? '',
                        apellido_materno: e.apellido_materno ?? '',
                        dependencia_clave: e.dependencia_clave ?? '',
                        delegacion_clave: e.delegacion_clave ?? '',
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
        <div className="mx-auto max-w-2xl">
            <Link
                to="/dashboard/empleados"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Empleados
            </Link>

            {/* Cabecera de vista */}
            <div className="mb-8 pl-1">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {isEdit ? 'Edición de Colaborador' : 'Alta de Colaborador'}
                </h2>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg">
                    {isEdit ? 'Actualiza la información del colaborador y gestiona su acceso al sistema.' : 'Complete la información requerida para registrar y asignar al colaborador en la base del sistema.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
                        <X size={16} strokeWidth={2.5}/> <span>{errors.general}</span>
                    </div>
                )}

                {/* TARJETA 1: DATOS PERSONALES */}
                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm shadow-zinc-900/5 dark:shadow-none transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-xl bg-brand-gold/10 dark:bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                            <UserCheck size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                Información Personal
                            </h3>
                            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">Identidad básica del empleado</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <Field label="NUE (Número Único)" error={errors.nue?.[0]}>
                                    <input type="text" value={form.nue} onChange={f('nue')} placeholder="Ej. 00012345" maxLength={15} required className={inputClass} />
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Field label="Nombre(s)" error={errors.nombre?.[0]}>
                                    <input type="text" value={form.nombre} onChange={f('nombre')} placeholder="Ej. Juan Carlos" maxLength={80} required className={inputClass} />
                                </Field>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Field label="Apellido Paterno" error={errors.apellido_paterno?.[0]}>
                                <input type="text" value={form.apellido_paterno} onChange={f('apellido_paterno')} placeholder="Apellido paterno" maxLength={80} className={inputClass} />
                            </Field>
                            <Field label="Apellido Materno" error={errors.apellido_materno?.[0]}>
                                <input type="text" value={form.apellido_materno} onChange={f('apellido_materno')} placeholder="Apellido materno" maxLength={80} className={inputClass} />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* TARJETA 2: ASIGNACIÓN ADMINISTRATIVA */}
                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm shadow-zinc-900/5 dark:shadow-none transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                            <Briefcase size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                Asignación Administrativa
                            </h3>
                            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">Centro de trabajo y situación laboral</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Dependencia (UR)" error={errors.dependencia_clave?.[0]}>
                                <div className="relative">
                                    <select value={form.dependencia_clave} onChange={(e) => setForm(p => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))} required className={selectClass}>
                                        <option value="">Seleccione dependencia...</option>
                                        {dependencias.map(d => <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2.5} />
                                </div>
                            </Field>
                            <Field label="Delegación" error={errors.delegacion_clave?.[0]}>
                                <div className="relative">
                                    <select value={form.delegacion_clave} onChange={f('delegacion_clave')} disabled={!form.dependencia_clave} required className={selectClass}>
                                        <option value="">Seleccione delegación...</option>
                                        {delegaciones.map(d => <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2.5} />
                                </div>
                            </Field>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 px-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <div>
                                <h4 className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Estado del Empleado</h4>
                                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Permite o deniega el acceso a las funciones del vestuario.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner overflow-hidden ${form.activo ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                            >
                                <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all duration-300 ${form.activo ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* TARJETA 3: ACCESO Y USUARIO */}
                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm shadow-zinc-900/5 dark:shadow-none transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
                            <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                Vínculo de Sistema
                            </h3>
                            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">Control de acceso y credenciales</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Field label="Usuario asignado" error={errors.user_id?.[0]}>
                            {userLinked ? (
                                <div className="flex items-center justify-between p-4 px-5 rounded-2xl border border-brand-gold/50 bg-brand-gold/5 shadow-sm shadow-brand-gold/5">
                                    <div className="flex items-center gap-4">
                                        <div className="size-[42px] rounded-full bg-brand-gold/15 flex flex-col items-center justify-center text-brand-gold">
                                            <Key size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight">{userLinked.name}</p>
                                            <p className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400 mt-0.5">RFC: {userLinked.rfc}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }} className="px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-wider transition-all">
                                        Desvincular
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={2.5} />
                                        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por nombre o RFC en el sistema…" className={`${inputClass} !pl-12`} />
                                    </div>
                                    {userResults.length > 0 && (
                                        <div className="mt-2 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/80 divide-y divide-zinc-50 dark:divide-zinc-800/60 overflow-hidden shadow-md shadow-zinc-900/5">
                                            {userResults.map(u => (
                                                <button key={u.id} type="button" onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:pl-6 transition-all duration-300">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{u.name}</p>
                                                        <p className="text-[12px] text-zinc-500 font-mono mt-0.5">{u.rfc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {!userResults.length && userSearch && (
                                        <p className="text-[12px] font-medium text-zinc-400 pt-1 pl-1">No se encontraron usuarios coincidentes.</p>
                                    )}
                                </div>
                            )}
                        </Field>

                        {isEdit && !userLinked && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 gap-5">
                                <div>
                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Crear Acceso Rápido</p>
                                    <p className="text-[12px] text-zinc-500 mt-1 max-w-sm">Genera un usuario tipo "empleado" usando el RFC y lo vincula inmediatamente a este registro.</p>
                                </div>
                                <button type="button" onClick={abrirModalCrearUsuario} className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 hover:shadow-lg hover:shadow-zinc-900/10 active:scale-95 transition-all">
                                    <UserPlus size={16} strokeWidth={2.5} /> Crear Cuenta
                                </button>
                            </div>
                        )}
                        {!isEdit && (
                            <p className="text-[12px] font-medium text-zinc-400 pt-1 pl-1">
                                Podrás vincular o generar un usuario después de guardar al empleado por primera vez.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 pb-12">
                    <Link to="/dashboard/empleados" className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-none text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 text-[14px] font-bold active:scale-95 transition-all text-center flex items-center justify-center">
                        Descartar
                    </Link>
                    <button type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-gold text-white text-[14px] font-bold shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 disabled:opacity-50 active:scale-[0.98] transition-all">
                        {saving ? 'Procesando…' : (isEdit ? 'Guardar Cambios' : 'Registrar Nuevo Empleado')}
                    </button>
                </div>
            </form>

            <Modal
                open={modalCrearUsuario}
                onClose={() => !savingCrearUsuario && setModalCrearUsuario(false)}
                title="Nueva cuenta de usuario"
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
                <form id="form-crear-usuario-empleado" onSubmit={handleCrearUsuario} className="space-y-4">
                    {errorsCrearUsuario.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {Array.isArray(errorsCrearUsuario.general) ? errorsCrearUsuario.general[0] : errorsCrearUsuario.general}
                        </p>
                    )}
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Los datos del empleado se usan como referencia. Indique el <strong>RFC</strong> para el inicio de sesión y una contraseña segura.
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
