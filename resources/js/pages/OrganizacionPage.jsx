import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Building2, Users, UserCheck, Plus, ChevronRight, IdCard,
} from 'lucide-react';
import { Modal, ConfirmDialog } from '../components/ui';
import { api } from '../lib/api';
import { useDebounce } from '../lib/useDebounce';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Hook de búsqueda                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
function useSearch(baseUrl, params = {}, enabled = true) {
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch]   = useState('');
    const debounced             = useDebounce(search, 350);
    const paramsKey             = JSON.stringify(params);
    const reloadRef             = useRef(0);

    useEffect(() => {
        if (!enabled) { setData([]); setLoading(false); return; }
        const ctrl = new AbortController();
        setLoading(true);
        const qs = new URLSearchParams({ search: debounced, ...params });
        fetch(`${baseUrl}?${qs}`, {
            signal: ctrl.signal,
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(j  => { setData(j.data ?? []); setLoading(false); })
            .catch(e => { if (e.name !== 'AbortError') setLoading(false); });
        return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, debounced, paramsKey, enabled, reloadRef.current]);

    const reload = useCallback(() => { reloadRef.current += 1; }, []);
    return { data, loading, search, setSearch, reload };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Micro-componentes                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
function Inp({ className = '', ...props }) {
    return (
        <input
            className={`w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 text-[12px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#AF9460]/25 transition-all ${className}`}
            {...props}
        />
    );
}

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            {children}
            {error && <p className="text-[10px] text-red-500">{error}</p>}
        </div>
    );
}

function Spinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
        </div>
    );
}

function EmptyPanel({ icon: Icon, text, sub }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
            <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                <Icon size={22} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-zinc-500">{text}</p>
                {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function ErrMsg({ msg }) {
    return <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{msg}</p>;
}

function ModalFooter({ onCancel, form, saving, label }) {
    return (
        <>
            <button type="button" onClick={onCancel} disabled={saving}
                className="px-4 py-2 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
                Cancelar
            </button>
            <button type="submit" form={form} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold disabled:opacity-60 hover:opacity-90 transition-all">
                {saving && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {label}
            </button>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Panel genérico                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
function Panel({ title, icon: Icon, count, search, onSearch, onAdd, addLabel, locked, children }) {
    return (
        <div className={`flex flex-col h-full rounded-2xl border bg-white dark:bg-[#0F0F10] overflow-hidden transition-all duration-300 ${
            locked
                ? 'border-zinc-100 dark:border-zinc-800/50 opacity-50 pointer-events-none'
                : 'border-zinc-100 dark:border-zinc-800/80'
        }`}>
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-zinc-50 dark:border-zinc-800/60 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-[#AF9460]/10 flex items-center justify-center">
                            <Icon size={14} className="text-[#AF9460]" strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                            {title}
                        </span>
                        {count > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] font-bold flex items-center justify-center">
                                {count}
                            </span>
                        )}
                    </div>
                    {onAdd && (
                        <button onClick={onAdd}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold hover:opacity-90 active:scale-95 transition-all">
                            <Plus size={11} strokeWidth={2.5} /> {addLabel}
                        </button>
                    )}
                </div>
                <Inp placeholder={`Buscar ${title.toLowerCase()}...`} value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Tarjeta de selección (Panel 1 y 2)                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function ItemCard({ item, selected, onClick, onEdit, onDelete, stats }) {
    return (
        <div
            onClick={onClick}
            className={`group relative mx-3 my-1.5 rounded-xl px-4 py-3.5 cursor-pointer transition-all border select-none ${
                selected
                    ? 'bg-[#AF9460]/8 border-[#AF9460]/30 shadow-sm'
                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:border-zinc-100 dark:hover:border-zinc-800'
            }`}
        >
            {selected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[#AF9460] rounded-r-full" />
            )}

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black tracking-wider font-mono ${selected ? 'text-[#AF9460]' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {item.clave}
                        </span>
                    </div>
                    <p className={`text-[12px] font-semibold leading-tight truncate ${selected ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {item.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        {stats.map(({ icon: StatIcon, value, label }) => (
                            <span key={label} className="flex items-center gap-1 text-[9px] text-zinc-400">
                                <StatIcon size={10} strokeWidth={2} />
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">{value}</span> {label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        title="Editar"
                        className="size-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#AF9460] hover:bg-[#AF9460]/10 transition-all">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        title="Eliminar"
                        className="size-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                    </button>
                </div>
            </div>

            {selected && <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AF9460]" strokeWidth={2.5} />}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Tarjeta de trabajador (Panel 3)                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
function TrabajadorCard({ trab }) {
    return (
        <div className="mx-3 my-1.5 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
            <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[#AF9460]/10 flex items-center justify-center shrink-0">
                    <IdCard size={14} className="text-[#AF9460]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {trab.nombre_completo}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-400">NUE: {trab.nue}</span>
                        <span className="text-[9px] text-zinc-400">{trab.delegacion}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Página principal                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function OrganizacionPage() {

    /* ── Selección en cascada ─────────────────────────────────────────── */
    const [selDep, setSelDep] = useState(null);  // dependencia seleccionada
    const [selDel, setSelDel] = useState(null);  // delegado seleccionado

    /* ── Panel 1: Dependencias (tabla: dependences) ───────────────────── */
    const depCtx = useSearch('/api/dependencias');

    /* ── Panel 2: Delegados de la UR (tabla: delegado) ───────────────── */
    const delCtx = useSearch(
        '/api/delegados',
        selDep ? { ur: selDep.clave } : {},
        !!selDep
    );

    /* ── Panel 3: Trabajadores del delegado (tabla: delegacion) ──────── */
    const trabCtx = useSearch(
        '/api/trabajadores',
        selDel ? { delegado_id: selDel.id } : {},
        !!selDel
    );

    /* ── Reset en cascada ─────────────────────────────────────────────── */
    const selectDep = (dep) => {
        if (selDep?.id === dep.id) { setSelDep(null); setSelDel(null); }
        else { setSelDep(dep); setSelDel(null); }
    };
    const selectDel = (del) => {
        if (selDel?.id === del.id) setSelDel(null);
        else setSelDel(del);
    };

    /* ── Estado de modales ────────────────────────────────────────────── */
    const [modalDep,   setModalDep]   = useState(null); // null | 'create' | {mode:'edit', item}
    const [modalDel,   setModalDel]   = useState(null);
    const [confirm,    setConfirm]    = useState(null); // { type:'dep'|'del', item }
    const [saving,     setSaving]     = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Dependencia form: clave = key (max 5), nombre = name
    const [formDep, setFormDep] = useState({ clave: '', nombre: '' });

    // Delegado form: nombre, delegacion (sin guión, ej: "3B101")
    const [formDel, setFormDel] = useState({ nombre: '', delegacion: '' });

    /* ── Handlers Dependencias ────────────────────────────────────────── */
    const openCreateDep = () => {
        setFormDep({ clave: '', nombre: '' });
        setFormErrors({});
        setModalDep('create');
    };
    const openEditDep = (item) => {
        setFormDep({ clave: item.clave, nombre: item.nombre });
        setFormErrors({});
        setModalDep({ mode: 'edit', item });
    };
    const saveDep = async (e) => {
        e.preventDefault(); setSaving(true); setFormErrors({});
        try {
            if (modalDep === 'create') await api.post('/api/dependencias', formDep);
            else await api.put(`/api/dependencias/${modalDep.item.id}`, formDep);
            setModalDep(null); depCtx.reload();
        } catch (err) { setFormErrors(err.errors ?? { general: err.message }); }
        finally { setSaving(false); }
    };
    const deleteDep = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/dependencias/${confirm.item.id}`);
            setConfirm(null); depCtx.reload(); setSelDep(null); setSelDel(null);
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    /* ── Handlers Delegados ───────────────────────────────────────────── */
    const openCreateDel = () => {
        setFormDel({ nombre: '', delegacion: '' });
        setFormErrors({});
        setModalDel('create');
    };
    const openEditDel = (item) => {
        setFormDel({ nombre: item.nombre, delegacion: item.clave });
        setFormErrors({});
        setModalDel({ mode: 'edit', item });
    };
    const saveDel = async (e) => {
        e.preventDefault(); setSaving(true); setFormErrors({});
        try {
            if (modalDel === 'create') {
                await api.post('/api/delegados', {
                    ...formDel,
                    ur: selDep.clave,
                });
            } else {
                await api.put(`/api/delegados/${modalDel.item.id}`, formDel);
            }
            setModalDel(null); delCtx.reload();
        } catch (err) { setFormErrors(err.errors ?? { general: err.message }); }
        finally { setSaving(false); }
    };
    const deleteDel = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/delegados/${confirm.item.id}`);
            setConfirm(null); delCtx.reload();
            if (selDel?.id === confirm.item.id) setSelDel(null);
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    /* ── UI ───────────────────────────────────────────────────────────── */
    return (
        <div className="flex flex-col h-full">

            {/* Encabezado */}
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                    Explorador Organizacional
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Navega la estructura: Dependencia → Delegado → Trabajadores
                </p>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-5 min-h-[32px]">
                <button onClick={() => { setSelDep(null); setSelDel(null); }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-[#AF9460] uppercase tracking-wider transition-colors">
                    Estructura
                </button>
                {selDep && (<>
                    <ChevronRight size={12} className="text-zinc-300" />
                    <button onClick={() => setSelDel(null)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#AF9460]/10 text-[#AF9460] text-[10px] font-bold uppercase tracking-wider">
                        <Building2 size={10} /> UR {selDep.clave}
                    </button>
                </>)}
                {selDel && (<>
                    <ChevronRight size={12} className="text-zinc-300" />
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                        <UserCheck size={10} /> {selDel.clave}
                    </span>
                </>)}
            </div>

            {/* Tres paneles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 280px)' }}>

                {/* ── Panel 1: Dependencias (tabla: dependences) ────── */}
                <Panel title="Dependencias" icon={Building2} count={depCtx.data.length}
                    search={depCtx.search} onSearch={depCtx.setSearch}
                    onAdd={openCreateDep} addLabel="Nueva">
                    {depCtx.loading ? <Spinner /> : depCtx.data.length === 0
                        ? <EmptyPanel icon={Building2} text="Sin dependencias" sub="Crea la primera UR" />
                        : depCtx.data.map((dep) => (
                            <ItemCard key={dep.id} item={dep} selected={selDep?.id === dep.id}
                                onClick={() => selectDep(dep)}
                                onEdit={openEditDep}
                                onDelete={(item) => setConfirm({ type: 'dep', item })}
                                stats={[
                                    { icon: UserCheck, value: dep.delegados_count,    label: 'delegados' },
                                    { icon: Users,     value: dep.trabajadores_count,  label: 'trabajadores' },
                                ]}
                            />
                        ))
                    }
                </Panel>

                {/* ── Panel 2: Delegados de la UR (tabla: delegado) ─── */}
                <Panel title="Delegados" icon={UserCheck}
                    count={delCtx.data.length}
                    search={delCtx.search} onSearch={delCtx.setSearch}
                    locked={!selDep}
                    onAdd={selDep ? openCreateDel : null} addLabel="Nuevo">
                    {!selDep
                        ? <EmptyPanel icon={UserCheck} text="Selecciona una dependencia" sub="para ver sus delegados" />
                        : delCtx.loading ? <Spinner />
                        : delCtx.data.length === 0
                        ? <EmptyPanel icon={UserCheck} text="Sin delegados" sub={`en UR ${selDep.clave}`} />
                        : delCtx.data.map((del) => (
                            <ItemCard key={del.id} item={del} selected={selDel?.id === del.id}
                                onClick={() => selectDel(del)}
                                onEdit={openEditDel}
                                onDelete={(item) => setConfirm({ type: 'del', item })}
                                stats={[
                                    { icon: Users, value: del.trabajadores_count, label: 'trabajadores' },
                                ]}
                            />
                        ))
                    }
                </Panel>

                {/* ── Panel 3: Trabajadores del delegado (tabla: delegacion) */}
                <Panel title="Trabajadores" icon={Users}
                    count={trabCtx.data.length}
                    search={trabCtx.search} onSearch={trabCtx.setSearch}
                    locked={!selDel}>
                    {!selDel
                        ? <EmptyPanel icon={Users} text="Selecciona un delegado" sub="para ver sus trabajadores" />
                        : trabCtx.loading ? <Spinner />
                        : trabCtx.data.length === 0
                        ? <EmptyPanel icon={Users} text="Sin trabajadores" sub={`para delegación ${selDel.clave}`} />
                        : trabCtx.data.map((trab) => (
                            <TrabajadorCard key={trab.id} trab={trab} />
                        ))
                    }
                </Panel>
            </div>

            {/* ── Modal: Nueva / Editar Dependencia ──────────────────── */}
            <Modal open={!!modalDep} onClose={() => setModalDep(null)} size="sm"
                title={modalDep === 'create' ? 'Nueva Dependencia' : 'Editar Dependencia'}
                footer={<ModalFooter onCancel={() => setModalDep(null)} form="form-dep" saving={saving}
                    label={modalDep === 'create' ? 'Crear' : 'Guardar'} />}>
                <form id="form-dep" onSubmit={saveDep} className="space-y-4">
                    {formErrors.general && <ErrMsg msg={formErrors.general} />}
                    <Field label="Clave UR (máx. 5 caracteres)" error={formErrors.clave?.[0]}>
                        <Inp value={formDep.clave}
                            onChange={(e) => setFormDep({ ...formDep, clave: e.target.value.toUpperCase() })}
                            placeholder="Ej. 3, 12, IMSS" maxLength={5} required />
                    </Field>
                    <Field label="Nombre de la dependencia" error={formErrors.nombre?.[0]}>
                        <Inp value={formDep.nombre}
                            onChange={(e) => setFormDep({ ...formDep, nombre: e.target.value })}
                            placeholder="Nombre completo" required />
                    </Field>
                </form>
            </Modal>

            {/* ── Modal: Nuevo / Editar Delegado ─────────────────────── */}
            <Modal open={!!modalDel} onClose={() => setModalDel(null)} size="sm"
                title={modalDel === 'create'
                    ? `Nuevo Delegado — UR ${selDep?.clave}`
                    : 'Editar Delegado'}
                footer={<ModalFooter onCancel={() => setModalDel(null)} form="form-del" saving={saving}
                    label={modalDel === 'create' ? 'Crear' : 'Guardar'} />}>
                <form id="form-del" onSubmit={saveDel} className="space-y-4">
                    {formErrors.general && <ErrMsg msg={formErrors.general} />}
                    <Field label="Nombre completo" error={formErrors.nombre?.[0]}>
                        <Inp value={formDel.nombre}
                            onChange={(e) => setFormDel({ ...formDel, nombre: e.target.value.toUpperCase() })}
                            placeholder="Ej. JUAN PÉREZ LÓPEZ" maxLength={120} required />
                    </Field>
                    <Field label="Código de delegación (sin guión)" error={formErrors.delegacion?.[0]}>
                        <Inp value={formDel.delegacion}
                            onChange={(e) => setFormDel({ ...formDel, delegacion: e.target.value.toUpperCase() })}
                            placeholder="Ej. 3B101" maxLength={25} required />
                        <p className="text-[10px] text-zinc-400 mt-1">
                            Corresponde al código sin guión de la tabla de trabajadores (ej: 3B-101 → 3B101)
                        </p>
                    </Field>
                </form>
            </Modal>

            {/* ── Confirmar eliminación ───────────────────────────────── */}
            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={confirm?.type === 'dep' ? deleteDep : deleteDel}
                loading={saving}
                title={confirm?.type === 'dep' ? 'Eliminar Dependencia' : 'Eliminar Delegado'}
                message={
                    confirm?.type === 'dep'
                        ? `¿Eliminar la dependencia UR "${confirm?.item?.clave}"? Solo es posible si no tiene delegados ni trabajadores.`
                        : `¿Eliminar al delegado "${confirm?.item?.nombre}"?`
                }
            />
        </div>
    );
}
