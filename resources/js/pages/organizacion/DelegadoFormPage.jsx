/**
 * Crear o editar delegado — vista completa (no modal).
 * La creación de cuenta de usuario sigue en un modal secundario.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { SearchInput, Modal } from '../../components/ui';

const inputClass = 'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';
const selectClass = 'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

const EMPTY_CREAR_USUARIO = {
    name: '',
    rfc: '',
    email: '',
    password: '',
    password_confirmation: '',
    empleado_id: '',
};

export default function DelegadoFormPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNuevo = location.pathname.endsWith('/nuevo');
    const isEdit = Boolean(id) && !isNuevo;

    const urContext = location.state?.ur ?? new URLSearchParams(location.search).get('ur');

    const [form, setForm] = useState({ delegacion_id: '', user_id: '', empleado_id: '' });
    const [delegaciones, setDelegaciones] = useState([]);
    const [candidatosEmpleados, setCandidatosEmpleados] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userLinked, setUserLinked] = useState(null);
    const userSearchTimer = useRef(null);

    const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
    const [crearUsuarioForm, setCrearUsuarioForm] = useState(EMPTY_CREAR_USUARIO);
    const [errorsCrearUsuario, setErrorsCrearUsuario] = useState({});
    const [savingCrearUsuario, setSavingCrearUsuario] = useState(false);
    const [empleadosSugeridos, setEmpleadosSugeridos] = useState([]);
    const [buscandoEmpleados, setBuscandoEmpleados] = useState(false);

    const [item, setItem] = useState(null);

    useEffect(() => {
        const url = urContext
            ? `/api/delegaciones?ur=${encodeURIComponent(urContext)}`
            : '/api/delegaciones/all';
        api.get(url)
            .then((r) => {
                const rows = r.data ?? [];
                setDelegaciones(Array.isArray(rows) ? rows : []);
            })
            .catch(() => setDelegaciones([]));
    }, [urContext]);

    useEffect(() => {
        if (!isEdit) {
            setForm({ delegacion_id: '', user_id: '', empleado_id: '' });
            setUserLinked(null);
            setItem(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/api/delegados/${id}`)
            .then((res) => {
                const row = res.data;
                if (!row?.id) {
                    navigate('/dashboard/delegados', { replace: true });
                    return;
                }
                setItem(row);
                setForm({
                    user_id: row.user_id ?? '',
                    empleado_id: row.empleado_id != null ? String(row.empleado_id) : '',
                });
                if (row.user) {
                    setUserLinked(row.user);
                } else {
                    setUserLinked(null);
                }
            })
            .catch(() => navigate('/dashboard/delegados', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    useEffect(() => {
        let cancelled = false;
        if (isEdit && item?.delegaciones?.length > 0) {
            Promise.all(
                item.delegaciones.map((d) =>
                    api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(d.clave)}&per_page=200`),
                ),
            )
                .then((results) => {
                    if (cancelled) return;
                    const map = new Map();
                    results.forEach((r) => (r.data ?? []).forEach((e) => map.set(e.id, e)));
                    setCandidatosEmpleados(
                        [...map.values()].sort((a, b) =>
                            (a.nombre_completo || '').localeCompare(b.nombre_completo || '', 'es'),
                        ),
                    );
                })
                .catch(() => {
                    if (!cancelled) setCandidatosEmpleados([]);
                });
        } else if (!isEdit && form.delegacion_id) {
            const del = delegaciones.find((d) => String(d.id) === String(form.delegacion_id));
            if (del?.clave) {
                api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(del.clave)}&per_page=200`)
                    .then((r) => {
                        if (!cancelled) setCandidatosEmpleados(r.data ?? []);
                    })
                    .catch(() => {
                        if (!cancelled) setCandidatosEmpleados([]);
                    });
            } else if (!cancelled) {
                setCandidatosEmpleados([]);
            }
        } else if (!cancelled) {
            setCandidatosEmpleados([]);
        }
        return () => {
            cancelled = true;
        };
    }, [isEdit, item?.id, item?.delegaciones, form.delegacion_id, delegaciones]);

    useEffect(() => {
        clearTimeout(userSearchTimer.current);
        if (!userSearch.trim()) {
            setUserResults([]);
            return;
        }
        userSearchTimer.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(userSearch)}&per_page=8`)
                .then((r) => setUserResults(r.data ?? []))
                .catch(() => {});
        }, 350);
        return () => clearTimeout(userSearchTimer.current);
    }, [userSearch]);

    const resetUserSearch = () => {
        setUserSearch('');
        setUserResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = {
                user_id: form.user_id || null,
                empleado_id: form.empleado_id ? parseInt(form.empleado_id, 10) : null,
            };
            if (isEdit) {
                await api.put(`/api/delegados/${id}`, payload);
            } else {
                payload.delegacion_id = parseInt(form.delegacion_id, 10);
                // En este flujo `ur` viene del contexto (la UR desde donde se abrió el formulario).
                // El backend lo guarda en el pivote `delegado_delegacion` para que los filtros por UR funcionen.
                if (urContext) {
                    payload.ur = urContext;
                }
                await api.post('/api/delegados', payload);
            }
            navigate('/dashboard/delegados', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    const abrirModalCrearUsuario = () => {
        setCrearUsuarioForm({
            ...EMPTY_CREAR_USUARIO,
            name: item?.empleado?.nombre_completo || item?.nombre || '',
            rfc: '',
            empleado_id: item?.empleado?.id ? String(item.empleado.id) : '',
        });
        setErrorsCrearUsuario({});
        setModalCrearUsuario(true);
    };

    useEffect(() => {
        if (!modalCrearUsuario || !isEdit) return;
        const queryBase = (item?.empleado?.nombre_completo || item?.nombre || '').trim();
        if (!queryBase) {
            setEmpleadosSugeridos([]);
            return;
        }
        setBuscandoEmpleados(true);
        api.get(`/api/empleados?search=${encodeURIComponent(queryBase)}&per_page=50`)
            .then((r) => {
                const rows = Array.isArray(r?.data?.data) ? r.data.data : (Array.isArray(r?.data) ? r.data : []);
                const filtrados = rows.filter((e) => {
                    const pertenece = !item?.delegaciones?.length || item.delegaciones.some((d) => d.clave === e.delegacion_clave);
                    return pertenece;
                });
                setEmpleadosSugeridos(filtrados);
                if (!crearUsuarioForm.empleado_id && filtrados.length === 1) {
                    setCrearUsuarioForm((p) => ({ ...p, empleado_id: String(filtrados[0].id) }));
                }
            })
            .catch(() => setEmpleadosSugeridos([]))
            .finally(() => setBuscandoEmpleados(false));
    }, [modalCrearUsuario, isEdit, item?.id, item?.nombre, item?.empleado?.id, item?.empleado?.nombre_completo, item?.delegaciones, crearUsuarioForm.empleado_id]);

    const handleCrearUsuario = async (e) => {
        e.preventDefault();
        if (!isEdit) return;
        setSavingCrearUsuario(true);
        setErrorsCrearUsuario({});
        try {
            const res = await api.post(`/api/delegados/${id}/crear-usuario`, crearUsuarioForm);
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

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto w-full max-w-2xl px-1 sm:px-2">
                <Link
                    to="/dashboard/delegados"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-gold mb-6 transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={2} />
                    Volver a Delegados
                </Link>

                <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-50 px-5 py-5 dark:border-zinc-800/60 sm:px-8">
                        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
                            {isEdit ? 'Editar delegado' : 'Nuevo delegado'}
                        </h2>
                        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {isEdit
                                ? 'Vincule usuario del sistema y, si aplica, el registro de empleado del padrón.'
                                : 'Asigne una delegación y, opcionalmente, usuario y empleado. Podrá crear la cuenta al editar el registro.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
                        {errors.general && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-500/10">
                                {errors.general}
                            </p>
                        )}

                        {!isEdit && (
                            <Field label="Delegación asignada" error={errors.delegacion_id?.[0]}>
                                <select
                                    value={form.delegacion_id}
                                    onChange={(e) => setForm({ ...form, delegacion_id: e.target.value, empleado_id: '' })}
                                    required
                                    className={selectClass}
                                >
                                    <option value="">Seleccionar…</option>
                                    {delegaciones.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.clave}
                                            {d.nombre ? ` — ${d.nombre}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        )}

                        {((isEdit && item?.delegaciones?.length > 0) || (!isEdit && form.delegacion_id)) && (
                            <Field label="Registro de empleado (opcional)" error={errors.empleado_id?.[0]}>
                                <select
                                    value={form.empleado_id}
                                    onChange={(e) => setForm({ ...form, empleado_id: e.target.value })}
                                    className={selectClass}
                                >
                                    <option value="">Sin vincular</option>
                                    {candidatosEmpleados.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.nombre_completo} — NUE {e.nue}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    Si el delegado figura en el padrón, elija su fila. La cuenta nueva quedará vinculada a delegado y empleado.
                                </p>
                            </Field>
                        )}

                        <Field label="Usuario del sistema (opcional)" error={errors.user_id?.[0]}>
                            {userLinked ? (
                                <div className="flex items-center justify-between rounded-xl border border-brand-gold/35 bg-brand-gold/5 px-3 py-3">
                                    <div>
                                        <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{userLinked.name}</p>
                                        <p className="font-mono text-[11px] text-zinc-400">{userLinked.rfc || userLinked.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserLinked(null);
                                            setForm((p) => ({ ...p, user_id: '' }));
                                            resetUserSearch();
                                        }}
                                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <SearchInput
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Nombre o RFC…"
                                        inputClassName="text-base sm:text-sm"
                                    />
                                    {userResults.length > 0 && (
                                        <div className="max-h-36 divide-y divide-zinc-50 overflow-y-auto overflow-hidden rounded-xl border border-zinc-100 dark:divide-zinc-800/60 dark:border-zinc-800">
                                            {userResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setUserLinked(u);
                                                        setForm((p) => ({ ...p, user_id: u.id }));
                                                        resetUserSearch();
                                                    }}
                                                    className="flex min-h-[44px] w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-brand-gold/5"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{u.name}</p>
                                                        <p className="font-mono text-[11px] text-zinc-400">{u.rfc || u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {!userResults.length && userSearch && (
                                        <p className="px-1 text-[12px] text-zinc-400">Sin resultados.</p>
                                    )}
                                </div>
                            )}
                        </Field>

                        {isEdit && !userLinked && (
                            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/20">
                                <p className="mb-3 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Cree una cuenta con RFC y contraseña; se asignan los roles delegado y empleado.
                                </p>
                                <button
                                    type="button"
                                    onClick={abrirModalCrearUsuario}
                                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-[13px] font-bold text-zinc-800 transition-colors hover:bg-white dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto"
                                >
                                    <UserPlus size={16} strokeWidth={2} />
                                    Crear usuario
                                </button>
                            </div>
                        )}

                        {!isEdit && (
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                                Guarde primero; luego podrá crear cuenta o vincular usuario desde la edición.
                            </p>
                        )}

                        <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800/80 sm:flex-row sm:justify-end">
                            <Link
                                to="/dashboard/delegados"
                                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-auto"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto"
                            >
                                {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal
                open={modalCrearUsuario}
                onClose={() => !savingCrearUsuario && setModalCrearUsuario(false)}
                title="Nueva cuenta de usuario"
                size="2xl"
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={savingCrearUsuario}
                            onClick={() => setModalCrearUsuario(false)}
                            className="min-h-[44px] w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-crear-usuario-delegado"
                            disabled={savingCrearUsuario}
                            className="min-h-[44px] w-full rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto"
                        >
                            {savingCrearUsuario ? 'Creando…' : 'Crear y vincular'}
                        </button>
                    </div>
                }
            >
                <form id="form-crear-usuario-delegado" onSubmit={handleCrearUsuario} className="space-y-4">
                    {errorsCrearUsuario.general && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-500/10">
                            {Array.isArray(errorsCrearUsuario.general) ? errorsCrearUsuario.general[0] : errorsCrearUsuario.general}
                        </p>
                    )}
                    <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Indique el <strong className="text-zinc-800 dark:text-zinc-200">RFC</strong> para el acceso y una contraseña segura.
                    </p>
                    <Field label="Empleado (auto sugerido)" error={errorsCrearUsuario.empleado_id?.[0]}>
                        <select
                            value={crearUsuarioForm.empleado_id}
                            onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, empleado_id: e.target.value }))}
                            className={selectClass}
                        >
                            <option value="">Sin vincular</option>
                            {empleadosSugeridos.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nombre_completo} — NUE {emp.nue || 'S/N'} — {emp.delegacion_clave || 'SIN DEL'}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {buscandoEmpleados
                                ? 'Buscando coincidencias en empleados...'
                                : 'Se muestran empleados que coinciden por nombre del delegado y pertenecen a sus delegaciones.'}
                        </p>
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Nombre para la cuenta" error={errorsCrearUsuario.name?.[0]}>
                            <input
                                type="text"
                                value={crearUsuarioForm.name}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Nombre completo"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="RFC (usuario)" error={errorsCrearUsuario.rfc?.[0]}>
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
                    <Field label="Correo (opcional)" error={errorsCrearUsuario.email?.[0]}>
                        <input
                            type="email"
                            value={crearUsuarioForm.email}
                            onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="correo@institucion.gob.mx"
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <Field label="Confirmar" error={errorsCrearUsuario.password_confirmation?.[0]}>
                            <input
                                type="password"
                                value={crearUsuarioForm.password_confirmation}
                                onChange={(e) => setCrearUsuarioForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                                placeholder="Repetir"
                                autoComplete="new-password"
                                required
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </form>
            </Modal>
        </>
    );
}
