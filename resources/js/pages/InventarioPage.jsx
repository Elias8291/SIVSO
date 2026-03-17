import { PageHeader } from '../components/ui';

export default function InventarioPage() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Inventario"
                description="Gestión de stock y suministros del sistema."
            />
            <div className="bg-white dark:bg-[#111111] rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-12 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Módulo en desarrollo. Próximamente disponible.</p>
            </div>
        </div>
    );
}
