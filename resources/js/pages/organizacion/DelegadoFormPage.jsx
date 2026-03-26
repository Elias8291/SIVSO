/**
 * Crear o editar delegado.
 * Flujo: 1) buscar/crear empleado  →  2) vincular/crear usuario  →  3) guardar.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Eye, EyeOff, Search, UserPlus, X,
    CheckCircle2, ChevronRight, UserCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Modal } from '../../components/ui';

/* ─── Estilos compartidos ─────────────────────────────────────────── */
const inputCls = 'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';
const selectCls = 'w-full px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/40 transition-all touch-manipulation';

function Field({ label, error, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children}
            {hint && <p className="text-[11px] text-zinc-400 leading-relaxed">{hint}</p>}
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

function SectionCard({ title, description, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-50 px-5 py-4 dark:border-zinc-800/60 sm:px-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</p>
                {description && <p className="mt-0.5 text-[12px] text-zinc-400 dark:text-zinc-500">{description}</p>}
            </div>
            <div className="p-5 sm:p-6 space-y-4">
                {children}
            </div>
        </div>
    );
}

/* ─── Componente de búsqueda en tiempo real de empleados ──────────── */
function EmpleadoSearch({ value, onChange, onClear }) {
    return (
        <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder="Buscar por nombre o NUE…"
                className={`${inputCls} pl-9 pr-9`}
                autoComplete="off"
            />
            {value && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

/* ─── Tarjeta de empleado seleccionado ───────────────────────────── */
function EmpleadoCard({ empleado, onDesvincular }) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3 min-w-0">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" strokeWidth={2} />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide leading-snug">
                        {empleado.nombre_completo}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                        NUE {empleado.nue || '—'} · {empleado.delegacion_clave || empleado.dependencia_clave || '—'}
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={onDesvincular}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors"
                aria-label="Desvincular empleado"
            >
                <X size={14} strokeWidth={2.5} />
            </button>
        </div>
    );
}

/* ─── Tarjeta de usuario vinculado ───────────────────────────────── */
function UsuarioCard({ user, onDesvincular }) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-3">
            <div className="flex items-start gap-3 min-w-0">
                <UserCircle2 size={18} className="shrink-0 mt-0.5 text-brand-gold" strokeWidth={2} />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">{user.name}</p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-0.5">RFC {user.rfc || '—'}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={onDesvincular}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-colors"
                aria-label="Desvincular usuario"
            >
                <X size={14} strokeWidth={2.5} />
            </button>
        </div>
    );
}

/* ─── Estado vacío y lista de resultados ─────────────────────────── */
function ResultadoEmpleados({ resultados, cargando, busqueda, onSeleccionar }) {
    if (!busqueda.trim()) return null;
    if (cargando) return (
        <div className="flex items-center gap-2 px-1 py-2 text-[12px] text-zinc-400">
            <span className="size-4 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin shrink-0" />
            Buscando…
        </div>
    );
    if (resultados.length === 0) return (
        <p className="px-1 text-[12px] text-zinc-400">Sin resultados para «{busqueda}».</p>
    );
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60">
            {resultados.map((emp) => (
                <button
                    key={emp.id}
                    type="button"
                    onClick={() => onSeleccionar(emp)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-gold/5 transition-colors min-h-[52px]"
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 uppercase truncate">
                            {emp.nombre_completo}
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                            NUE {emp.nue || '—'} · {emp.delegacion_clave || '—'}
                        </p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-zinc-300" />
                </button>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Página principal                                                  */
/* ══════════════════════════════════════════════════════════════════ */
const EMPTY_USUARIO = { name: '', rfc: '', email: '', password: '', password_confirmation: '' };
const EMPTY_NUEVO_EMPLEADO = { nue: '', nombre: '', apellido_paterno: '', apellido_materno: '', dependencia_clave: '', delegacion_clave: '' };

export default function DelegadoFormPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNuevo = location.pathname.endsWith('/nuevo');
    const isEdit = Boolean(id) && !isNuevo;

    const urContext = location.state?.ur ?? new URLSearchParams(location.search).get('ur');

    /* ── Estado principal ──────────────────────────────────────── */
    const [delegaciones, setDelegaciones] = useState([]);
    const [delegacionId, setDelegacionId] = useState('');
    const [nombreDelegado, setNombreDelegado] = useState('');

    /* empleado vinculado al delegado */
    const [empleadoVinculado, setEmpleadoVinculado] = useState(null);

    /* usuario vinculado al delegado */
    const [usuarioVinculado, setUsuarioVinculado] = useState(null);

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    /* ── Búsqueda de empleados ─────────────────────────────────── */
    const [busqEmpleado, setBusqEmpleado] = useState('');
    const [resultadosEmpleado, setResultadosEmpleado] = useState([]);
    const [cargandoEmpleado, setCargandoEmpleado] = useState(false);
    const timerEmpleado = useRef(null);

    /* ── Búsqueda de usuarios existentes ───────────────────────── */
    const [busqUsuario, setBusqUsuario] = useState('');
    const [resultadosUsuario, setResultadosUsuario] = useState([]);
    const timerUsuario = useRef(null);

    /* ── Modal crear usuario nuevo ─────────────────────────────── */
    const [modalUsuario, setModalUsuario] = useState(false);
    const [formUsuario, setFormUsuario] = useState(EMPTY_USUARIO);
    const [errUsuario, setErrUsuario] = useState({});
    const [savingUsuario, setSavingUsuario] = useState(false);
    const [verPassword, setVerPassword] = useState(false);

    /* ── Modal crear empleado nuevo ─────────────────────────────── */
    const [modalEmpleado, setModalEmpleado] = useState(false);
    const [formEmpleado, setFormEmpleado] = useState(EMPTY_NUEVO_EMPLEADO);
    const [errEmpleado, setErrEmpleado] = useState({});
    const [savingEmpleado, setSavingEmpleado] = useState(false);
    const [dependencias, setDependencias] = useState([]);
    const [delegacionesEmpleado, setDelegacionesEmpleado] = useState([]);

    /* ── Cargar delegaciones para selector (creación) ──────────── */
    useEffect(() => {
        const url = urContext
            ? `/api/delegaciones?ur=${encodeURIComponent(urContext)}`
            : '/api/delegaciones/all';
        api.get(url)
            .then((r) => setDelegaciones(Array.isArray(r.data) ? r.data : []))
            .catch(() => setDelegaciones([]));
    }, [urContext]);

    /* ── Cargar datos para modal de nuevo empleado ─────────────── */
    useEffect(() => {
        if (!modalEmpleado) return;
        api.get('/api/dependencias?search=').then(r => setDependencias(r.data ?? [])).catch(() => {});
    }, [modalEmpleado]);

    useEffect(() => {
        const dep = formEmpleado.dependencia_clave;
        if (!dep) { setDelegacionesEmpleado([]); return; }
        api.get(`/api/delegaciones?ur=${dep}`).then(r => setDelegacionesEmpleado(r.data ?? [])).catch(() => {});
    }, [formEmpleado.dependencia_clave]);

    /* ── Cargar delegado existente al editar ───────────────────── */
    useEffect(() => {
        if (!isEdit) {
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/api/delegados/${id}`)
            .then((res) => {
                const row = res.data;
                if (!row?.id) { navigate('/dashboard/delegados', { replace: true }); return; }
                setNombreDelegado(row.nombre || '');
                if (row.empleado) {
                    setEmpleadoVinculado({
                        id: row.empleado.id,
                        nombre_completo: row.empleado.nombre_completo,
                        nue: row.empleado.nue,
                        delegacion_clave: row.delegaciones?.[0]?.clave || '',
                    });
                }
                if (row.user) setUsuarioVinculado(row.user);
            })
            .catch(() => navigate('/dashboard/delegados', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    /* ── Búsqueda de empleados (debounced) ─────────────────────── */
    useEffect(() => {
        clearTimeout(timerEmpleado.current);
        const q = busqEmpleado.trim();
        if (q.length < 2) { setResultadosEmpleado([]); return; }
        setCargandoEmpleado(true);
        timerEmpleado.current = setTimeout(() => {
            api.get(`/api/empleados?search=${encodeURIComponent(q)}&per_page=30`)
                .then((r) => {
                    const rows = Array.isArray(r?.data?.data) ? r.data.data
                        : Array.isArray(r?.data) ? r.data : [];
                    setResultadosEmpleado(rows);
                })
                .catch(() => setResultadosEmpleado([]))
                .finally(() => setCargandoEmpleado(false));
        }, 350);
        return () => clearTimeout(timerEmpleado.current);
    }, [busqEmpleado]);

    /* ── Búsqueda de usuarios (debounced) ──────────────────────── */
    useEffect(() => {
        clearTimeout(timerUsuario.current);
        const q = busqUsuario.trim();
        if (!q) { setResultadosUsuario([]); return; }
        timerUsuario.current = setTimeout(() => {
            api.get(`/api/usuarios?search=${encodeURIComponent(q)}&per_page=8`)
                .then((r) => setResultadosUsuario(r.data ?? []))
                .catch(() => {});
        }, 350);
        return () => clearTimeout(timerUsuario.current);
    }, [busqUsuario]);

    /* ── Guardar delegado ──────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = {
                user_id: usuarioVinculado?.id || null,
                empleado_id: empleadoVinculado?.id || null,
            };
            if (isEdit) {
                await api.put(`/api/delegados/${id}`, payload);
            } else {
                payload.delegacion_id = parseInt(delegacionId, 10);
                if (urContext) payload.ur = urContext;
                await api.post('/api/delegados', payload);
            }
            navigate('/dashboard/delegados', { replace: true });
        } catch (err) {
            setErrors(err.errors ?? { general: err.message });
        } finally {
            setSaving(false);
        }
    };

    /* ── Crear usuario nuevo ───────────────────────────────────── */
    const abrirModalUsuario = () => {
        setFormUsuario({
            ...EMPTY_USUARIO,
            name: empleadoVinculado?.nombre_completo || '',
        });
        setErrUsuario({});
        setVerPassword(false);
        setModalUsuario(true);
    };

    const handleCrearUsuario = async (e) => {
        e.preventDefault();
        if (!isEdit) return;
        setSavingUsuario(true);
        setErrUsuario({});
        try {
            const payload = {
                ...formUsuario,
                empleado_id: empleadoVinculado?.id || null,
            };
            const res = await api.post(`/api/delegados/${id}/crear-usuario`, payload);
            const u = res.user ?? res;
            if (u?.id) {
                setUsuarioVinculado({ id: u.id, name: u.name, rfc: u.rfc });
            }
            setModalUsuario(false);
        } catch (err) {
            setErrUsuario(err.errors ?? { general: [err.message] });
        } finally {
            setSavingUsuario(false);
        }
    };

    /* ── Crear empleado nuevo ──────────────────────────────────── */
    const abrirModalEmpleado = () => {
        const partes = busqEmpleado.trim().split(/\s+/);
        setFormEmpleado({
            ...EMPTY_NUEVO_EMPLEADO,
            nombre: partes[0] || '',
            apellido_paterno: partes[1] || '',
            apellido_materno: partes[2] || '',
        });
        setErrEmpleado({});
        setModalEmpleado(true);
    };

    const handleCrearEmpleado = async (e) => {
        e.preventDefault();
        setSavingEmpleado(true);
        setErrEmpleado({});
        try {
            const res = await api.post('/api/empleados', formEmpleado);
            const nuevoId = res.id;
            if (nuevoId) {
                const detalle = await api.get(`/api/empleados/${nuevoId}`);
                const emp = detalle.data ?? detalle;
                setEmpleadoVinculado({
                    id: emp.id,
                    nombre_completo: emp.nombre_completo || emp.nombre || '',
                    nue: emp.nue,
                    delegacion_clave: emp.delegacion_clave || '',
                });
                setFormUsuario((p) => ({ ...p, name: emp.nombre_completo || emp.nombre || '' }));
                setBusqEmpleado('');
                setResultadosEmpleado([]);
            }
            setModalEmpleado(false);
        } catch (err) {
            setErrEmpleado(err.errors ?? { general: [err.message] });
        } finally {
            setSavingEmpleado(false);
        }
    };

    /* ── Render ─────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto w-full max-w-2xl px-2 pb-12">
                <Link
                    to="/dashboard/delegados"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-brand-gold mb-6 transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={2} />
                    Volver a Delegados
                </Link>

                <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    {isEdit ? 'Editar delegado' : 'Nuevo delegado'}
                </h1>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-8">
                    Vincule el empleado del padrón y después cree o asigne su cuenta de acceso.
                </p>

                {errors.general && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ── Delegación (solo creación) ──────────────── */}
                    {!isEdit && (
                        <SectionCard title="Delegación asignada">
                            <Field label="Delegación" error={errors.delegacion_id?.[0]}>
                                <select
                                    value={delegacionId}
                                    onChange={(e) => setDelegacionId(e.target.value)}
                                    required
                                    className={selectCls}
                                >
                                    <option value="">Seleccionar…</option>
                                    {delegaciones.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.clave}{d.nombre ? ` — ${d.nombre}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </SectionCard>
                    )}

                    {/* ── Paso 1: Empleado ────────────────────────── */}
                    <SectionCard
                        title="Paso 1 · Empleado del padrón"
                        description="Busque al colaborador por nombre o NUE. Si no existe, puede crearlo."
                    >
                        {isEdit && nombreDelegado ? (
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">Delegado</span>
                                <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">{nombreDelegado}</span>
                            </div>
                        ) : null}
                        {empleadoVinculado ? (
                            <EmpleadoCard
                                empleado={empleadoVinculado}
                                onDesvincular={() => {
                                    setEmpleadoVinculado(null);
                                    setResultadosEmpleado([]);
                                }}
                            />
                        ) : (
                            <div className="space-y-3">
                                <EmpleadoSearch
                                    value={busqEmpleado}
                                    onChange={(e) => setBusqEmpleado(e.target.value)}
                                    onClear={() => { setBusqEmpleado(''); setResultadosEmpleado([]); }}
                                />
                                <ResultadoEmpleados
                                    resultados={resultadosEmpleado}
                                    cargando={cargandoEmpleado}
                                    busqueda={busqEmpleado}
                                    onSeleccionar={(emp) => {
                                        setEmpleadoVinculado(emp);
                                        setResultadosEmpleado([]);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={abrirModalEmpleado}
                                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-[12px] font-semibold text-zinc-600 hover:border-brand-gold/40 hover:text-brand-gold dark:border-zinc-700 dark:text-zinc-400 transition-colors"
                                >
                                    <UserPlus size={14} strokeWidth={2} />
                                    Crear empleado nuevo
                                </button>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Paso 2: Usuario ─────────────────────────── */}
                    <SectionCard
                        title="Paso 2 · Cuenta de acceso"
                        description="Vincule un usuario existente o cree uno nuevo para este delegado."
                    >
                        {usuarioVinculado ? (
                            <UsuarioCard
                                user={usuarioVinculado}
                                onDesvincular={() => {
                                    setUsuarioVinculado(null);
                                    setBusqUsuario('');
                                }}
                            />
                        ) : (
                            <div className="space-y-3">
                                {/* Buscar usuario existente */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={busqUsuario}
                                        onChange={(e) => setBusqUsuario(e.target.value)}
                                        placeholder="Buscar usuario existente por nombre o RFC…"
                                        className={`${inputCls} pl-9`}
                                        autoComplete="off"
                                    />
                                </div>
                                {resultadosUsuario.length > 0 && (
                                    <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60">
                                        {resultadosUsuario.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => {
                                                    setUsuarioVinculado(u);
                                                    setBusqUsuario('');
                                                    setResultadosUsuario([]);
                                                }}
                                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-gold/5 transition-colors min-h-[52px]"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">{u.name}</p>
                                                    <p className="font-mono text-[11px] text-zinc-400 mt-0.5">RFC {u.rfc || '—'}</p>
                                                </div>
                                                <ChevronRight size={14} className="shrink-0 text-zinc-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {busqUsuario && resultadosUsuario.length === 0 && (
                                    <p className="text-[12px] text-zinc-400">Sin resultados.</p>
                                )}

                                {/* Crear cuenta nueva (solo en edición) */}
                                {isEdit ? (
                                    <button
                                        type="button"
                                        onClick={abrirModalUsuario}
                                        className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-xl border border-brand-gold/35 bg-brand-gold/5 px-4 py-2.5 text-[13px] font-bold text-brand-gold hover:bg-brand-gold/10 transition-colors touch-manipulation"
                                    >
                                        <UserPlus size={15} strokeWidth={2.2} />
                                        Crear cuenta nueva para este delegado
                                    </button>
                                ) : (
                                    <p className="text-[12px] text-zinc-400">
                                        Guarde primero; luego podrá crear la cuenta desde la edición.
                                    </p>
                                )}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Botones ──────────────────────────────────── */}
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <Link
                            to="/dashboard/delegados"
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:w-auto"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || (!isEdit && !delegacionId)}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto"
                        >
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear delegado'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ══ Modal: crear cuenta de usuario ══════════════════════════ */}
            <Modal
                open={modalUsuario}
                onClose={() => !savingUsuario && setModalUsuario(false)}
                title="Nueva cuenta de usuario"
                size="2xl"
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={savingUsuario}
                            onClick={() => setModalUsuario(false)}
                            className="min-h-[44px] w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-nuevo-usuario-delegado"
                            disabled={savingUsuario}
                            className="min-h-[44px] w-full rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto"
                        >
                            {savingUsuario ? 'Creando…' : 'Crear y vincular'}
                        </button>
                    </div>
                }
            >
                <form id="form-nuevo-usuario-delegado" onSubmit={handleCrearUsuario} className="space-y-4">
                    {errUsuario.general && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-500/10">
                            {Array.isArray(errUsuario.general) ? errUsuario.general[0] : errUsuario.general}
                        </p>
                    )}

                    {empleadoVinculado && (
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-[12px] text-zinc-600 dark:text-zinc-400">
                            Empleado: <strong className="text-zinc-800 dark:text-zinc-200">{empleadoVinculado.nombre_completo}</strong>
                            {empleadoVinculado.nue && <span className="font-mono ml-2 text-zinc-400">NUE {empleadoVinculado.nue}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nombre completo</label>
                            <input
                                type="text"
                                value={formUsuario.name}
                                onChange={(e) => setFormUsuario((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Nombre completo"
                                className={inputCls}
                            />
                            {errUsuario.name?.[0] && <p className="text-[11px] text-red-500">{errUsuario.name[0]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">RFC (usuario de acceso) *</label>
                            <input
                                type="text"
                                value={formUsuario.rfc}
                                onChange={(e) => setFormUsuario((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                                placeholder="Ej. ABCD123456EF7"
                                maxLength={20}
                                required
                                className={inputCls}
                            />
                            {errUsuario.rfc?.[0] && <p className="text-[11px] text-red-500">{errUsuario.rfc[0]}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Correo electrónico (opcional)</label>
                        <input
                            type="email"
                            value={formUsuario.email}
                            onChange={(e) => setFormUsuario((p) => ({ ...p, email: e.target.value }))}
                            placeholder="correo@institucion.gob.mx"
                            className={inputCls}
                        />
                        {errUsuario.email?.[0] && <p className="text-[11px] text-red-500">{errUsuario.email[0]}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Contraseña *</label>
                            <div className="relative">
                                <input
                                    type={verPassword ? 'text' : 'password'}
                                    value={formUsuario.password}
                                    onChange={(e) => setFormUsuario((p) => ({ ...p, password: e.target.value }))}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    required
                                    className={`${inputCls} pr-11`}
                                />
                                <button type="button" onClick={() => setVerPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    aria-label={verPassword ? 'Ocultar' : 'Mostrar'}
                                >
                                    {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errUsuario.password?.[0] && <p className="text-[11px] text-red-500">{errUsuario.password[0]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Confirmar contraseña *</label>
                            <input
                                type={verPassword ? 'text' : 'password'}
                                value={formUsuario.password_confirmation}
                                onChange={(e) => setFormUsuario((p) => ({ ...p, password_confirmation: e.target.value }))}
                                placeholder="Repetir contraseña"
                                autoComplete="new-password"
                                required
                                className={inputCls}
                            />
                            {errUsuario.password_confirmation?.[0] && <p className="text-[11px] text-red-500">{errUsuario.password_confirmation[0]}</p>}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ══ Modal: crear empleado nuevo ══════════════════════════════ */}
            <Modal
                open={modalEmpleado}
                onClose={() => !savingEmpleado && setModalEmpleado(false)}
                title="Registrar nuevo empleado"
                size="2xl"
                footer={
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={savingEmpleado}
                            onClick={() => setModalEmpleado(false)}
                            className="min-h-[44px] w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-nuevo-empleado-delegado"
                            disabled={savingEmpleado}
                            className="min-h-[44px] w-full rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900 sm:w-auto"
                        >
                            {savingEmpleado ? 'Creando…' : 'Crear empleado'}
                        </button>
                    </div>
                }
            >
                <form id="form-nuevo-empleado-delegado" onSubmit={handleCrearEmpleado} className="space-y-4">
                    {errEmpleado.general && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-500/10">
                            {Array.isArray(errEmpleado.general) ? errEmpleado.general[0] : errEmpleado.general}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nombre(s) *</label>
                            <input type="text" value={formEmpleado.nombre}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder="Nombre(s)" required className={inputCls} />
                            {errEmpleado.nombre?.[0] && <p className="text-[11px] text-red-500">{errEmpleado.nombre[0]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">NUE *</label>
                            <input type="text" value={formEmpleado.nue}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, nue: e.target.value }))}
                                placeholder="Número único de empleado" maxLength={15} required className={inputCls} />
                            {errEmpleado.nue?.[0] && <p className="text-[11px] text-red-500">{errEmpleado.nue[0]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Apellido paterno</label>
                            <input type="text" value={formEmpleado.apellido_paterno}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, apellido_paterno: e.target.value }))}
                                placeholder="Opcional" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Apellido materno</label>
                            <input type="text" value={formEmpleado.apellido_materno}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, apellido_materno: e.target.value }))}
                                placeholder="Opcional" className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Unidad responsable (UR) *</label>
                            <select value={formEmpleado.dependencia_clave}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, dependencia_clave: e.target.value, delegacion_clave: '' }))}
                                required className={selectCls}>
                                <option value="">Seleccione UR…</option>
                                {dependencias.map((d) => <option key={d.clave} value={d.clave}>{d.clave} — {d.nombre}</option>)}
                            </select>
                            {errEmpleado.dependencia_clave?.[0] && <p className="text-[11px] text-red-500">{errEmpleado.dependencia_clave[0]}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Delegación *</label>
                            <select value={formEmpleado.delegacion_clave}
                                onChange={(e) => setFormEmpleado((p) => ({ ...p, delegacion_clave: e.target.value }))}
                                disabled={!formEmpleado.dependencia_clave}
                                required className={`${selectCls} ${!formEmpleado.dependencia_clave ? 'opacity-50' : ''}`}>
                                <option value="">Seleccione delegación…</option>
                                {delegacionesEmpleado.map((d) => <option key={d.clave} value={d.clave}>{d.clave}{d.nombre ? ` — ${d.nombre}` : ''}</option>)}
                            </select>
                            {errEmpleado.delegacion_clave?.[0] && <p className="text-[11px] text-red-500">{errEmpleado.delegacion_clave[0]}</p>}
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
}
