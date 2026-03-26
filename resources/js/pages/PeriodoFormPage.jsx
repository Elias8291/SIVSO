import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Card, PageHeader } from '../components/ui';

const EMPTY_FORM = {
    anio: new Date().getFullYear(),
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'pendiente',
    descripcion: '',
};

const inputCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-800 dark:text-zinc-200 placeholder-zinc-400';

function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
            {children}
            {error && <p className="mt-0.5 text-xs text-red-500">{Array.isArray(error) ? error[0] : error}</p>}
        </div>
    );
}

export default function PeriodoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id) && id !== 'nuevo';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [notificarAlCrear, setNotificarAlCrear] = useState(true);

    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        api.get('/api/periodos')
            .then((res) => {
                const list = res.data ?? [];
                const p = list.find((x) => String(x.id) === String(id));
                if (!p) {
                    navigate('/dashboard/periodos', { replace: true });
                    return;
                }
                setForm({
                    anio: p.anio,
                    nombre: p.nombre,
                    fecha_inicio: p.fecha_inicio?.slice(0, 10) ?? '',
                    fecha_fin: p.fecha_fin?.slice(0, 10) ?? '',
                    estado: p.estado,
                    descripcion: p.descripcion ?? '',
                });
            })
            .catch(() => navigate('/dashboard/periodos', { replace: true }))
            .finally(() => setLoading(false));
    }, [id, isEdit, navigate]);

    const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

    const title = useMemo(() => (isEdit ? 'Editar periodo' : 'Nuevo periodo'), [isEdit]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/api/periodos/${id}`, form);
            } else {
                await api.post('/api/periodos', { ...form, notificar: notificarAlCrear });
            }
            navigate('/dashboard/periodos', { replace: true });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            else setErrors({ general: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-sm text-zinc-400">Cargando...</div>;
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                to="/dashboard/periodos"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-brand-gold"
            >
                <ArrowLeft size={16} strokeWidth={2} />
                Volver a periodos
            </Link>

            <PageHeader title={title} description="Configura año, rango de fechas y estado del periodo." />

            <Card className="mt-6">
                <form onSubmit={save} className="space-y-4 p-5 sm:p-6">
                    {errors.general && (
                        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                            {errors.general}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Año" error={errors.anio}>
                            <input type="number" value={form.anio} onChange={(e) => set('anio', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Estado" error={errors.estado}>
                            <select value={form.estado} onChange={(e) => set('estado', e.target.value)} className={inputCls}>
                                <option value="pendiente">Pendiente</option>
                                <option value="abierto">Abierto</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Nombre" error={errors.nombre}>
                        <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls} />
                    </Field>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Fecha inicio" error={errors.fecha_inicio}>
                            <input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Fecha fin" error={errors.fecha_fin}>
                            <input type="date" value={form.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} className={inputCls} />
                        </Field>
                    </div>

                    <Field label="Descripción (opcional)" error={errors.descripcion}>
                        <textarea rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={`${inputCls} resize-none`} />
                    </Field>

                    {!isEdit && form.estado === 'abierto' && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                            <input
                                type="checkbox"
                                className="mt-0.5 size-4 rounded border-zinc-300 text-brand-gold focus:ring-brand-gold/30"
                                checked={notificarAlCrear}
                                onChange={(e) => setNotificarAlCrear(e.target.checked)}
                            />
                            <span className="text-[12px] leading-snug text-zinc-600 dark:text-zinc-400">
                                Enviar avisos en el panel al crear el periodo abierto.
                            </span>
                        </label>
                    )}

                    <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:justify-end dark:border-zinc-800">
                        <Link to="/dashboard/periodos" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={saving} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900">
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

