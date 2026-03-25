import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Card, DataTable } from '../components/ui';
import { api } from '../lib/api';

export default function DelegacionEmpleadosPage() {
    const { delegacionId } = useParams();
    const navigate = useNavigate();
    const { can } = useAuth();
    const idNum = delegacionId ? parseInt(delegacionId, 10) : NaN;
    const canVerEmpleados = can('ver_empleados');
    const canVerVestuario = can('ver_empleados') || can('ver_mi_delegacion');

    const [delegacion, setDelegacion] = useState(null);
    const [loadErr, setLoadErr] = useState(null);
    const [loadingDel, setLoadingDel] = useState(true);
    const [empleados, setEmpleados] = useState([]);
    const [loadingEmp, setLoadingEmp] = useState(false);
    /** @type {Record<string, boolean>} clave UR lógica → expandido */
    const [urExpanded, setUrExpanded] = useState({});

    useEffect(() => {
        if (!idNum || Number.isNaN(idNum)) {
            setLoadErr('Delegación no válida.');
            setLoadingDel(false);
            setDelegacion(null);
            return;
        }
        setLoadingDel(true);
        setLoadErr(null);
        api.get(`/api/delegaciones/${idNum}`)
            .then((r) => {
                const d = r.data;
                if (!d?.clave) {
                    setLoadErr('Delegación no encontrada.');
                    setDelegacion(null);
                    return;
                }
                setDelegacion(d);
            })
            .catch((err) => {
                setLoadErr(err.message || 'No se pudo cargar la delegación.');
                setDelegacion(null);
            })
            .finally(() => setLoadingDel(false));
    }, [idNum]);

    useEffect(() => {
        if (!delegacion?.clave || !canVerEmpleados) {
            setEmpleados([]);
            setLoadingEmp(false);
            return;
        }
        setLoadingEmp(true);
        api.get(`/api/empleados?delegacion_clave=${encodeURIComponent(delegacion.clave)}&per_page=100`)
            .then((r) => setEmpleados(r.data ?? []))
            .catch(() => setEmpleados([]))
            .finally(() => setLoadingEmp(false));
    }, [delegacion?.clave, canVerEmpleados]);

    const vestuarioState = useMemo(
        () => ({
            from: `/dashboard/delegaciones/${delegacionId}`,
            fromLabel: 'Volver a la delegación',
        }),
        [delegacionId]
    );

    const variasUrs = (delegacion?.dependencias?.length ?? 0) > 1;

    const empleadosOrdenados = useMemo(() => {
        const list = [...empleados];
        if (!variasUrs || list.length === 0) {
            return list;
        }
        const sortKey = (row) => (row.dependencia_clave ? String(row.dependencia_clave) : '\uFFFF');
        return list.sort((a, b) => {
            const c = sortKey(a).localeCompare(sortKey(b), 'es', { sensitivity: 'base' });
            if (c !== 0) {
                return c;
            }
            return String(a.nue ?? '').localeCompare(String(b.nue ?? ''), 'es', { numeric: true });
        });
    }, [empleados, variasUrs]);

    const gruposUr = useMemo(() => {
        if (!variasUrs) {
            return [];
        }
        const groups = [];
        for (const row of empleadosOrdenados) {
            const key = row.dependencia_clave != null && row.dependencia_clave !== ''
                ? String(row.dependencia_clave)
                : '__sin_ur__';
            const last = groups[groups.length - 1];
            if (last && last.key === key) {
                last.rows.push(row);
            } else {
                groups.push({
                    key,
                    clave: row.dependencia_clave,
                    nombre: row.dependencia_nombre,
                    rows: [row],
                });
            }
        }
        return groups;
    }, [variasUrs, empleadosOrdenados]);

    useEffect(() => {
        if (!variasUrs || gruposUr.length === 0) {
            return;
        }
        setUrExpanded((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const g of gruposUr) {
                if (!(g.key in next)) {
                    next[g.key] = true;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [variasUrs, gruposUr]);

    const columns = useMemo(() => {
        const empleadoCol = {
            key: 'nombre_completo',
            label: 'Servidor público',
            render: (val, row) => (
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                        {val}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 font-mono tracking-tight">
                        NUE <span className="text-zinc-700 dark:text-zinc-300">{row.nue ?? '—'}</span>
                    </p>
                </div>
            ),
        };

        const urCol = {
            key: 'dependencia_clave',
            label: 'UR de adscripción',
            tdClass: 'align-top',
            render: (v, row) => (
                <div className="min-w-[5rem] max-w-[15rem] rounded-md border border-zinc-200/90 dark:border-zinc-600/60 bg-white/60 dark:bg-zinc-800/40 px-3 py-2">
                    <p className="text-[12px] font-semibold tabular-nums text-zinc-800 dark:text-zinc-100 tracking-tight">
                        {v ?? '—'}
                    </p>
                    {row.dependencia_nombre ? (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-snug line-clamp-2">
                            {row.dependencia_nombre}
                        </p>
                    ) : null}
                </div>
            ),
        };

        const estadoCol = {
            key: 'actualizado',
            label: 'Estatus',
            render: (_, row) => (
                row.actualizado ? (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-emerald-200/90 bg-white text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/25 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.08em]">
                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                        Actualizado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold uppercase tracking-[0.08em]">
                        <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" aria-hidden />
                        Pendiente
                    </span>
                )
            ),
        };

        const base = variasUrs
            ? [empleadoCol, estadoCol]
            : [empleadoCol, urCol, estadoCol];

        if (!canVerVestuario) {
            return base;
        }
        return [
            ...base,
            {
                key: 'vestuario',
                label: 'Vestuario',
                render: (_, row) => (
                    <Link
                        to={`/dashboard/empleados/${row.id}/vestuario`}
                        state={vestuarioState}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold uppercase tracking-[0.1em] hover:border-brand-gold/45 hover:text-brand-gold dark:hover:border-brand-gold/35 transition-colors"
                    >
                        Consultar
                    </Link>
                ),
            },
        ];
    }, [canVerVestuario, vestuarioState, variasUrs]);

    if (!idNum || Number.isNaN(idNum)) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-zinc-500">{loadErr || 'Delegación no válida.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/delegaciones')}
                    className="mt-4 text-brand-gold text-sm font-bold"
                >
                    Volver a Delegaciones
                </button>
            </div>
        );
    }

    if (loadingDel) {
        return (
            <div className="flex justify-center py-24">
                <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
            </div>
        );
    }

    if (loadErr || !delegacion) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-zinc-500">{loadErr || 'Delegación no encontrada.'}</p>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/delegaciones')}
                    className="mt-4 text-brand-gold text-sm font-bold"
                >
                    Volver a Delegaciones
                </button>
            </div>
        );
    }

    const nombresDelegados = delegacion.delegados_nombres ?? [];
    const dependencias = delegacion.dependencias ?? [];
    const count = delegacion.empleados_count ?? 0;

    const descParts = [
        `${count} registro${count === 1 ? '' : 's'} en el padrón`,
        delegacion.nombre || null,
        variasUrs ? 'Listado agrupado por unidad responsable' : null,
    ].filter(Boolean);

    return (
        <div>
            <button
                type="button"
                onClick={() => navigate('/dashboard/delegaciones')}
                className="inline-flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-brand-gold mb-4 transition-colors"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a Delegaciones
            </button>

            <PageHeader
                title={`Delegación ${delegacion.clave}`}
                description={descParts.join(' · ')}
            />

            <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
                <Card title={dependencias.length > 1 ? 'Unidades responsables' : 'Unidad responsable'}>
                    <div className="px-5 py-4">
                        {dependencias.length === 0 ? (
                            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                No hay dependencias vinculadas a esta delegación en el catálogo.
                            </p>
                        ) : (
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {dependencias.map((dep, i) => (
                                    <li key={`${dep.clave}-${i}`} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex gap-3">
                                            <span
                                                className="mt-0.5 w-px shrink-0 rounded-full bg-brand-gold/40 self-stretch min-h-[2.25rem]"
                                                aria-hidden
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 tracking-tight">
                                                    {dep.clave}
                                                </p>
                                                {dep.nombre ? (
                                                    <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                                        {dep.nombre}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>

                <Card title="Delegado ante la instancia">
                    <div className="px-5 py-4">
                        {nombresDelegados.length === 0 ? (
                            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                No consta delegado asignado para esta delegación.
                            </p>
                        ) : (
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {nombresDelegados.map((n, i) => (
                                    <li
                                        key={`${n}-${i}`}
                                        className="py-2.5 first:pt-0 last:pb-0 text-[13px] text-zinc-800 dark:text-zinc-200 leading-relaxed"
                                    >
                                        {n}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>
            </div>

            <div className="mt-5">
                <Card title="Padrón de personal">
                    {!canVerEmpleados ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 px-5 py-6 leading-relaxed">
                            No tiene permiso para listar empleados. Si su rol incluye «Empleados», podrá ver el padrón desde ese módulo.
                        </p>
                    ) : loadingEmp ? (
                        <div className="flex items-center justify-center py-16">
                            <span className="size-6 border-2 border-zinc-200 border-t-brand-gold rounded-full animate-spin" />
                        </div>
                    ) : variasUrs ? (
                        <div className="pb-2">
                            {gruposUr.length > 1 ? (
                                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 px-5 pt-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                                    <button
                                        type="button"
                                        onClick={() => setUrExpanded(Object.fromEntries(gruposUr.map((g) => [g.key, true])))}
                                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-brand-gold transition-colors"
                                    >
                                        Desplegar todas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUrExpanded(Object.fromEntries(gruposUr.map((g) => [g.key, false])))}
                                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-brand-gold transition-colors"
                                    >
                                        Contraer todas
                                    </button>
                                </div>
                            ) : null}
                            {gruposUr.length === 0 ? (
                                <div className="py-12 px-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    No hay personal registrado bajo esta delegación.
                                </div>
                            ) : (
                                <ul className="space-y-3 px-3 pt-3 sm:px-5 sm:pt-4">
                                    {gruposUr.map((g, gi) => {
                                        const open = urExpanded[g.key] !== false;
                                        const panelId = `ur-panel-${idNum}-${gi}`;
                                        const btnId = `ur-toggle-${idNum}-${gi}`;
                                        return (
                                            <li
                                                key={g.key}
                                                className="rounded-xl border border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/20 overflow-hidden shadow-sm"
                                            >
                                                <button
                                                    id={btnId}
                                                    type="button"
                                                    aria-expanded={open}
                                                    aria-controls={panelId}
                                                    onClick={() => setUrExpanded((p) => ({ ...p, [g.key]: !open }))}
                                                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40"
                                                >
                                                    <ChevronDown
                                                        size={18}
                                                        strokeWidth={2}
                                                        className={`shrink-0 mt-0.5 text-zinc-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
                                                        aria-hidden
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                                            Unidad responsable
                                                        </p>
                                                        <p className="mt-1 text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 tracking-tight">
                                                            {g.clave || 'Sin UR asignada'}
                                                        </p>
                                                        {g.nombre ? (
                                                            <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                                                {g.nombre}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <span className="shrink-0 self-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-[10px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-400">
                                                        {g.rows.length}
                                                    </span>
                                                </button>
                                                {open ? (
                                                    <div
                                                        id={panelId}
                                                        role="region"
                                                        aria-labelledby={btnId}
                                                        className="border-t border-zinc-100 dark:border-zinc-800/80"
                                                    >
                                                        <DataTable columns={columns} data={g.rows} loading={false} />
                                                    </div>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={empleadosOrdenados}
                            loading={false}
                            emptyMessage="No hay personal registrado bajo esta delegación."
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}
