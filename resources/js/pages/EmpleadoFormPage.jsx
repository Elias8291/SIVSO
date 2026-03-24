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
        <div className="w-full relative group">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 transition-colors group-focus-within:text-brand-gold">
                {label}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
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

const inputClass = "w-full bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:ring-0 focus:border-brand-gold dark:focus:border-brand-gold transition-colors py-2.5 px-0";
const selectClass = "w-full bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-0 focus:border-brand-gold dark:focus:border-brand-gold transition-colors py-2.5 pl-0 pr-8 appearance-none cursor-pointer";

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
        <div className="mx-auto max-w-4xl px-4 py-6 sm:py-12">
            <Link
                to="/dashboard/empleados"
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-12 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Regresar al catálogo
            </Link>

            {/* Cabecera de vista formal */}
            <div className="mb-12">
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-white">
                    {isEdit ? 'Edición de registro' : 'Alta de colaborador'}
                </h2>
                <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mt-3">
                    Ficha Administrativa General
                </p>
                <div className="h-px w-16 bg-brand-gold mt-6" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-16">
                {errors.general && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm flex items-center gap-3">
                        <X size={16} strokeWidth={2.5}/> <span>{errors.general}</span>
                    </div>
                )}

                {/* SECCIÓN 1: DATOS PERSONALES */}
                <section>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="text-brand-gold font-light">01.</span> Identidad Personal
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="md:col-span-1">
                            <Field label="NUE / ID" error={errors.nue?.[0]}>
                                <input type="text" value={form.nue} onChange={f('nue')} placeholder="00000000" maxLength={15} required className={inputClass} />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Nombre(s)" error={errors.nombre?.[0]}>
                                <input type="text" value={form.nombre} onChange={f('nombre')} placeholder="Escriba los nombres" maxLength={80} required className={inputClass} />
                            </Field>
                        </div>
                        <div className="md:col-span-1">
                            <Field label="Apellido Paterno" error={errors.apellido_paterno?.[0]}>
                                <input type="text" value={form.apellido_paterno} onChange={f('apellido_paterno')} placeholder="Opcional" maxLength={80} className={inputClass} />
                            </Field>
                        </div>
                        <div className="md:col-span-1">
                            <Field label="Apellido Materno" error={errors.apellido_materno?.[0]}>
                                <input type="text" value={form.apellido_materno} onChange={f('apellido_materno')} placeholder="Opcional" maxLength={80} className={inputClass} />
                            </Field>
                        </div>
                    </div>
                </section>

                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800/80" />

                {/* SECCIÓN 2: ASIGNACIÓN ADMINISTRATIVA */}
                <section>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="text-brand-gold font-light">02.</span> Asignación Organizacional
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Field label="Unidad Responsable (UR)" error={errors.dependencia_clave?.[0]}>
                            <div className="relative">
                                <select value={form.dependencia_clave} onChange={(e) => setForm(p => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))} required className={selectClass}>
                                    <option value="">Seleccione UR...</option>
                                    {dependencias.map(d => <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" strokeWidth={2} />
                            </div>
                        </Field>

                        <Field label="Delegación" error={errors.delegacion_clave?.[0]}>
                            <div className="relative">
                                <select value={form.delegacion_clave} onChange={f('delegacion_clave')} disabled={!form.dependencia_clave} required className={selectClass}>
                                    <option value="">Seleccione delegación...</option>
                                    {delegaciones.map(d => <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" strokeWidth={2} />
                            </div>
                        </Field>
                    </div>
                        
                    <div className="mt-8 flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Estado Operativo</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Activa o inactiva el acceso y procesamiento para este colaborador.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, activo: !p.activo }))}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.activo ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                        >
                            <span className={`absolute top-1 size-4 rounded-full transition-all duration-300 ${form.activo ? 'left-7 bg-white dark:bg-zinc-900 shadow-sm' : 'left-1 bg-white dark:bg-zinc-600'}`} />
                        </button>
                    </div>
                </section>

                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800/80" />

                {/* SECCIÓN 3: ACCESO Y USUARIO */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                            <span className="text-brand-gold font-light">03.</span> Cuenta de Sistema
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <Field label="Vínculo de credenciales" error={errors.user_id?.[0]}>
                            {userLinked ? (
                                <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 flex flex-col items-center justify-center text-zinc-900 dark:text-white">
                                            <Key size={14} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{userLinked.name}</p>
                                            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">RFC: {userLinked.rfc}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }} className="px-3 py-1 text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-widest transition-all">
                                        Desvincular
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Busque por nombre o RFC en los registros..." className={inputClass} />
                                        <Search size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" strokeWidth={2} />
                                    </div>
                                    {userResults.length > 0 && (
                                        <div className="bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200/50 dark:border-zinc-800 p-2">
                                            {userResults.map(u => (
                                                <button key={u.id} type="button" onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }} className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                    <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-200 truncate pr-4">{u.name}</p>
                                                    <p className="text-[10px] text-zinc-400 font-mono shrink-0">{u.rfc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {!userResults.length && userSearch && (
                                        <p className="text-[11px] text-zinc-400">Sin coincidencias.</p>
                                    )}
                                </div>
                            )}
                        </Field>

                        {isEdit && !userLinked && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mt-6">
                                <p className="text-[11px] text-zinc-500 w-full max-w-sm">
                                    Puede emitir una credencial automática desde los datos ingresados para que este colaborador acceda a la plataforma.
                                </p>
                                <button type="button" onClick={abrirModalCrearUsuario} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-900 border border-zinc-900 hover:bg-zinc-900 hover:text-white dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all">
                                    <UserPlus size={12} strokeWidth={2.5} /> Alta Rápida
                                </button>
                            </div>
                        )}
                        {!isEdit && (
                            <p className="text-[11px] text-zinc-500 mt-2">
                                Complete el registro principal para habilitar la generación o asignación de credenciales de usuario.
                            </p>
                        )}
                    </div>
                </section>

                <div className="pt-12 pb-24 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <Link to="/dashboard/empleados" className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                        Cancelar edición
                    </Link>
                    <button type="submit" disabled={saving} className="w-full sm:w-auto px-10 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all">
                        {saving ? 'PROCESANDO...' : (isEdit ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR')}
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
