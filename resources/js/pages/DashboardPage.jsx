import { TrendingUp, Clock, CheckCircle, Users } from 'lucide-react';
import { StatCard, PageHeader, StatusBadge, Card } from '../components/ui';

const KPI_ITEMS = [
    { label: 'Stock Total', value: '4,812', icon: <TrendingUp size={15} strokeWidth={1.8} /> },
    { label: 'Pendientes', value: '24', icon: <Clock size={15} strokeWidth={1.8} /> },
    { label: 'Completados', value: '912', icon: <CheckCircle size={15} strokeWidth={1.8} /> },
    { label: 'Sindicatos', value: '08', icon: <Users size={15} strokeWidth={1.8} /> },
];

const ACTIVITY_DATA = [
    { rfc: 'GOMJ880214', name: 'Juan Gómez Martínez', type: 'Calzado / Ejecutivo', status: 'entregado', date: 'Hoy, 09:41' },
    { rfc: 'PERL901005', name: 'Lucía Pérez Ramos', type: 'Uniforme de Gala', status: 'pendiente', date: 'Hoy, 08:15' },
    { rfc: 'MARA920315', name: 'Marcos Rayas Ortega', type: 'Equipo Táctico', status: 'entregado', date: 'Ayer, 16:30' },
    { rfc: 'SOLI870612', name: 'Sofía López Ibáñez', type: 'Playera Institucional', status: 'pendiente', date: 'Ayer, 11:00' },
    { rfc: 'VARM950120', name: 'Víctor Armas Ruiz', type: 'Pantalón de Trabajo', status: 'cancelado', date: '15 Mar' },
];

export default function DashboardPage() {
    return (
        <div>
            <PageHeader
                title="Panel de Control"
                description="Resumen operativo — Sistema de Vestuario y Calzado"
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {KPI_ITEMS.map((item) => (
                    <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        icon={item.icon}
                    />
                ))}
            </div>

            {/* Actividad reciente */}
            <Card title="Actividad Reciente">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-zinc-50 dark:border-zinc-800/60">
                            <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">Colaborador</th>
                            <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 hidden sm:table-cell">Asignación</th>
                            <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">Estatus</th>
                            <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 text-right hidden md:table-cell">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ACTIVITY_DATA.map((row, i) => (
                            <tr
                                key={row.rfc}
                                className={`${i < ACTIVITY_DATA.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/40' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase leading-none">
                                        {row.rfc}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 mt-1 leading-none">{row.name}</p>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{row.type}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={row.status} />
                                </td>
                                <td className="px-6 py-4 text-right hidden md:table-cell">
                                    <span className="text-[10px] text-zinc-400">{row.date}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
