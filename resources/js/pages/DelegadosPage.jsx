import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, SearchInput, Card, DataTable, ConfirmDialog, Modal } from '../components/ui';
import { api } from '../lib/api';

const inputClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";
const selectClass = "w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation";

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
};

function FormModal({ item, onClose, onSaved }) {
    const isEdit = !!item?.id;
    const [form, setForm] = useState({ nombre: '', delegacion_id: '', user_id: '', empleado_id: '' });
    const [delegaciones, setDelegaciones] = useState([]);
    const [candidatosEmpleados, setCandidatosEmpleados] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [userLinked, setUserLinked] = useState(null);
    const userSearchTimer = useRef(null);

    const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
    const [crearUsuarioForm, setCrearUsuarioForm] = useState(EMPTY_CREAR_USUARIO);
    const [errorsCrearUsuario, setErrorsCrearUsuario] = useState({});
    const [savingCrearUsuario, setSavingCrearUsuario] = useState(false);

    useEffect(() => {
        api.get('/api/delegaciones/all').then(r => setDelegaciones(r.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (item && item !== 'new') {
            setForm({
                nombre: item.nombre ?? '',
                user_id: item.user_id ?? '',
                empleado_id: item.empleado_id != null ? String(item.empleado_id) : '',
            });
            if (item.user) {
                setUserLinked(item.user);
            } else {
                setUserLinked(null);
            }
        } else {
            setForm({ nombre: '', delegacion_id: '', user_id: '', empleado_id: '' });
            setUserLinked(null);
        }
        setErrors({});
        setUserSearch('');
        setUserResults([]);
    }, [item]);

    useEffect(() => {
        let cancelled = false;
        if (isEdit && item?.delegaciones?.length > 0) {
            Promise.all(
                item.delegaciones.map((d) =>
                    api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(d.clave)}&per_page=200`)
                )
            )
                .then((results) => {
                    if (cancelled) return;
                    const map = new Map();
                    results.forEach((r) => (r.data ?? []).forEach((e) => map.set(e.id, e)));
                    setCandidatosEmpleados(
                        [...map.values()].sort((a, b) =>
                            (a.nombre_completo || '').localeCompare(b.nombre_completo || '', 'es')
                        )
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
        if (!userSearch.trim()) { setUserResults([]); return; }
        userSearchTimer.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(userSearch)}&per_page=8`)
                .then(r => setUserResults(r.data ?? [])).catch(() => { });
        }, 350);
        return () => clearTimeout(userSearchTimer.current);
    }, [userSearch]);

    const resetUserSearch = () => { setUserSearch(''); setUserResults([]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = {
                nombre: form.nombre,
                user_id: form.user_id || null,
                empleado_id: form.empleado_id ? parseInt(form.empleado_id, 10) : null,
            };
            if (isEdit) {
                await api.put(`/api/delegados/${item.id}`, payload);
            } else {
                payload.delegacion_id = parseInt(form.delegacion_id, 10);
                await api.post('/api/delegados', payload);
            }
            onSaved();
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally { setSaving(false); }
    };

    const abrirModalCrearUsuario = () => {
        setCrearUsuarioForm({
            ...EMPTY_CREAR_USUARIO,
            name: form.nombre || '',
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
            const res = await api.post(`/api/delegados/${item.id}/crear-usuario`, crearUsuarioForm);
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

    return (
        <>
            <Modal open={!!item && !modalCrearUsuario} onClose={onClose} title={isEdit ? 'Editar Delegado' : 'Nuevo Delegado'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{errors.general}</p>}
                    <Field label="Nombre completo" error={errors.nombre?.[0]}>
                        <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                            placeholder="Ej. JUAN PÉREZ LÓPEZ" maxLength={120} required className={inputClass} />
                    </Field>
                    {!isEdit && (
                        <Field label="Delegación asignada" error={errors.delegacion_id?.[0]}>
                            <select value={form.delegacion_id} onChange={(e) => setForm({ ...form, delegacion_id: e.target.value, empleado_id: '' })}
                                required className={selectClass}>
                                <option value="">Seleccionar…</option>
                                {delegaciones.map(d => (
                                    <option key={d.id} value={d.id}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {((isEdit && item?.delegaciones?.length > 0) || (!isEdit && form.delegacion_id)) && (
                        <Field label="Registro de empleado (misma persona, opcional)" error={errors.empleado_id?.[0]}>
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
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                                Si el delegado también está en el padrón de trabajadores, elija su fila. Al usar <strong>Crear usuario desde datos del delegado</strong>, la cuenta quedará vinculada al delegado y a ese empleado (acceso a Mi vestuario y Mi delegación).
                            </p>
                        </Field>
                    )}

                    <Field label="Vincular a usuario del sistema (opcional)" error={errors.user_id?.[0]}>
                        {userLinked ? (
                            <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-brand-gold/40 bg-brand-gold/5">
                                <div>
                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{userLinked.name}</p>
                                    <p className="text-[11px] text-zinc-400 font-mono">{userLinked.rfc || userLinked.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setUserLinked(null); setForm(p => ({ ...p, user_id: '' })); resetUserSearch(); }}
                                    className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all min-h-[44px] min-w-[44px]"
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" strokeWidth={1.8} />
                                    <input
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Buscar por nombre o RFC…"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                                {userResults.length > 0 && (
                                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60 overflow-hidden max-h-36 overflow-y-auto">
                                        {userResults.map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => { setUserLinked(u); setForm(p => ({ ...p, user_id: u.id })); resetUserSearch(); }}
                                                className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-brand-gold/5 transition-all min-h-[44px]"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{u.name}</p>
                                                    <p className="text-[11px] text-zinc-400 font-mono">{u.rfc || u.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!userResults.length && userSearch && (
                                    <p className="text-[12px] text-zinc-400 px-1">Sin resultados.</p>
                                )}
                            </div>
                        )}
                    </Field>

                    {isEdit && !userLinked && (
                        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                                Cree una cuenta nueva con el RFC del delegado; se asignarán los roles <strong className="text-zinc-800 dark:text-zinc-200">delegado</strong> y <strong className="text-zinc-800 dark:text-zinc-200">empleado</strong> y quedará vinculada a este registro.
                                {form.empleado_id ? (
                                    <span className="block mt-2 font-semibold text-brand-gold dark:text-amber-400/90">
                                        Tiene empleado vinculado: la misma cuenta servirá para Mi vestuario y Mi delegación (guarde antes si acaba de elegir el empleado).
                                    </span>
                                ) : (
                                    <span className="block mt-2 text-zinc-500 dark:text-zinc-500">
                                        Opcional: vincule arriba el registro del padrón si es la misma persona.
                                    </span>
                                )}
                            </p>
                            <button
                                type="button"
                                onClick={abrirModalCrearUsuario}
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 text-[13px] font-bold hover:bg-white dark:hover:bg-zinc-800 transition-all"
                            >
                                <UserPlus size={16} strokeWidth={2} />
                                Crear usuario desde datos del delegado
                            </button>
                        </div>
                    )}

                    {!isEdit && (
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 px-1">
                            Guarde el delegado primero; luego podrá crear una cuenta desde la edición o vincular un usuario existente.
                        </p>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                        <button type="submit" disabled={saving} className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all">
                            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={modalCrearUsuario}
                onClose={() => !savingCrearUsuario && setModalCrearUsuario(false)}
                title="Nueva cuenta de usuario"
                size="2xl"
                footer={
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end w-full">
                        <button
                            type="button"
                            disabled={savingCrearUsuario}
                            onClick={() => setModalCrearUsuario(false)}
                            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-crear-usuario-delegado"
                            disabled={savingCrearUsuario}
                            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold disabled:opacity-50"
                        >
                            {savingCrearUsuario ? 'Creando…' : 'Crear y vincular'}
                        </button>
                    </div>
                }
            >
                <form id="form-crear-usuario-delegado" onSubmit={handleCrearUsuario} className="space-y-4">
                    {errorsCrearUsuario.general && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                            {Array.isArray(errorsCrearUsuario.general) ? errorsCrearUsuario.general[0] : errorsCrearUsuario.general}
                        </p>
                    )}
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Los datos del delegado se usan como referencia. Indique el <strong>RFC</strong> para el inicio de sesión y una contraseña segura.
                        {form.empleado_id && (
                            <span className="block mt-2 text-amber-800 dark:text-amber-200/90 font-medium">
                                Si guardó un empleado vinculado, ese registro también quedará ligado a esta cuenta.
                            </span>
                        )}
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
        </>
    );
}

export default function DelegadosPage() {
    const { can } = useAuth();
    const canEdit = can('editar_delegados');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = () => {
        setLoading(true);
        const q = search.trim();
        api.get(`/api/delegados/resumen${q ? `?search=${encodeURIComponent(q)}` : ''}`)
            .then(r => setData(r.data ?? []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
    }, [search]);

    const handleDelete = async () => {
        if (!confirm?.id) return;
        setSaving(true);
        try {
            await api.delete(`/api/delegados/${confirm.id}`);
            setConfirm(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Nombre',
            render: (v, row) => (
                <div>
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{v}</p>
                    {row.user && (
                        <p className="text-[11px] text-brand-gold font-mono mt-0.5">{row.user.rfc || row.user.email}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'delegaciones_count',
            label: 'Delegaciones',
            render: (v) => <span className="text-[13px] text-zinc-500">{v}</span>,
        },
        {
            key: 'trabajadores_total',
            label: 'Trabajadores',
            render: (v) => <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{v}</span>,
        },
        {
            key: 'delegaciones',
            label: 'Claves',
            render: (v) => (
                <div className="flex flex-wrap gap-1">
                    {(v ?? []).slice(0, 5).map((d, i) => (
                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold">{d.clave}</span>
                    ))}
                    {(v ?? []).length > 5 && <span className="text-[10px] text-zinc-400">+{v.length - 5}</span>}
                </div>
            ),
            hideOnMobile: true,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Delegados"
                description="Delegados y las delegaciones que representan."
                actions={
                    canEdit ? (
                        <>
                            <button onClick={() => setEditing('new')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                                <Plus size={13} strokeWidth={2.5} /> Nuevo Delegado
                            </button>
                            <button onClick={() => setEditing('new')}
                                className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center size-10 rounded-xl bg-zinc-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-zinc-900 shadow-md border border-white/10 dark:border-zinc-900/10 hover:scale-105 active:scale-95 transition-all duration-300">
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    ) : null
                }
                search={<SearchInput placeholder="Buscar por nombre o clave..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            />

            <Card title={`Delegados (${data.length})`}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    onEdit={canEdit ? ((row) => setEditing(row)) : undefined}
                    onDelete={canEdit ? ((row) => setConfirm(row)) : undefined}
                    emptyMessage="Sin delegados registrados."
                />
            </Card>

            <FormModal
                item={editing}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); load(); }}
            />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
                loading={saving}
                title="Eliminar Delegado"
                message={`¿Eliminar delegado "${confirm?.nombre}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
