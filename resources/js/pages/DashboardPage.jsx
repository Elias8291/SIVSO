import { Users, Box, Building2, ShieldCheck } from 'lucide-react';
import { StatCard, PageHeader } from '../components/ui';

const KPI_ITEMS = [
    { label: 'Total Empleados', value: '1,248', icon: <Users size={15} strokeWidth={1.8} /> },
    { label: 'Productos Catálogo', value: '450', icon: <Box size={15} strokeWidth={1.8} /> },
    { label: 'Delegaciones', value: '12', icon: <Building2 size={15} strokeWidth={1.8} /> },
    { label: 'Usuarios Activos', value: '24', icon: <ShieldCheck size={15} strokeWidth={1.8} /> },
];

export default function DashboardPage() {
    return (
        <div>
            <PageHeader
                title="Panel de Control"
                description="Resumen operativo — Sistema de Vestuario y Calzado"
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {KPI_ITEMS.map((item) => (
                    <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        icon={item.icon}
                    />
                ))}
            </div>
        </div>
    );
}
