/**
 * Explorador Organizacional — Página refactorizada
 * Crear/editar en vistas separadas (no modales).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Users,
    UserCheck,
    ArrowRight,
    ClipboardList,
} from 'lucide-react';
import { api } from '../lib/api';
import { useOrganizacion } from '../features/organizacion/hooks/useOrganizacion';
import {
    ExplorerEmpty,
    ExplorerPath,
    ExplorerSpinner,
    ExplorerStepPill,
    ItemCard,
    MobileCard,
    TrabajadorCard,
    ProgramaCard,
    Panel,
    MobileLevel,
    ConfirmDeleteModal,
} from '../features/organizacion/components';

export default function OrganizacionPage() {
    const navigate = useNavigate();
    const ctx = useOrganizacion();
    const { selDep, selDel, selTrab, depCtx, delCtx, trabCtx, progCtx } = ctx;

    const [confirm, setConfirm] = useState(null);
    const [saving, setSaving] = useState(false);

    const openCreateDep = () => navigate('/dashboard/organizacion/dependencias/nueva');
    const openEditDep = (item) => navigate(`/dashboard/organizacion/dependencias/${item.id}/editar`);
    const openCreateDel = () => selDep && navigate('/dashboard/organizacion/delegados/nuevo', { state: { ur: selDep.clave, dep: selDep } });
    const openEditDel = (item) => navigate(`/dashboard/organizacion/delegados/${item.id}/editar`, { state: { item } });

    const deleteDep = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/dependencias/${confirm.item.id}`);
            setConfirm(null);
            depCtx.reload();
            ctx.goToLevel(0);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteDel = async () => {
        setSaving(true);
        try {
            await api.delete(`/api/delegados/${confirm.item.id}`);
            setConfirm(null);
            delCtx.reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const goToDep = () => ctx.goToLevel(0);
    const goBackToDep = () => ctx.goToLevel(1);

    return (
        <div className="flex flex-col h-full">
            {/* Encabezado innovador — omnibox style */}
            <header className="mb-6">
                <h2 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-tight">
                    Explorador Organizacional
                </h2>
                <p className="text-[13px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 mt-1 font-normal leading-relaxed">
                    Navega por la estructura o busca sin seleccionar — toca el buscador para cargar resultados
                </p>
            </header>

            {/* ─── MÓVIL: Flujo drill-down ────────────────────────────────── */}
            <div className="lg:hidden flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4 py-3 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <ExplorerStepPill active={!selDep} done={!!selDep} label="Dependencia" />
                    <ArrowRight size={12} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                    <ExplorerStepPill active={!!selDep && !selDel} done={!!selDel} label="Delegación" />
                    <ArrowRight size={12} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                    <ExplorerStepPill active={!!selDel && !selTrab} done={!!selTrab} label="Trabajador" />
                    <ArrowRight size={12} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                    <ExplorerStepPill active={!!selTrab} done={false} label="Programas" />
                </div>

                {!selDep && (
                    <MobileLevel
                        title="Elige una Dependencia (UR)"
                        subtitle="Unidades de respuesta disponibles"
                        icon={Building2}
                        search={depCtx.search}
                        onSearch={depCtx.setSearch}
                        onAdd={openCreateDep}
                        addLabel="Nueva dependencia"
                        loading={depCtx.loading}
                        empty={depCtx.data.length === 0}
                        emptyText="Sin dependencias"
                        emptySub="Crea la primera UR"
                    >
                        {depCtx.data.map((dep) => (
                            <MobileCard
                                key={dep.id}
                                badge={dep.clave}
                                title={dep.nombre}
                                stats={[
                                    { icon: UserCheck, value: dep.delegados_count, label: 'delegaciones' },
                                    { icon: Users, value: dep.trabajadores_count, label: 'trabajadores' },
                                ]}
                                onClick={() => ctx.selectDep(dep)}
                                onEdit={() => openEditDep(dep)}
                                onDelete={() => setConfirm({ type: 'dep', item: dep })}
                            />
                        ))}
                    </MobileLevel>
                )}

                {selDep && !selDel && (
                    <MobileLevel
                        title={`Delegaciones — UR ${selDep.clave}`}
                        subtitle={selDep.nombre}
                        icon={UserCheck}
                        search={delCtx.search}
                        onSearch={delCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(2)}
                        onAdd={openCreateDel}
                        addLabel="Nueva delegación"
                        loading={delCtx.loading}
                        empty={delCtx.data.length === 0}
                        emptyText="Sin delegaciones"
                        emptySub={`en UR ${selDep.clave}`}
                        onBack={goToDep}
                        backLabel={selDep.clave}
                    >
                        {delCtx.data.map((del) => (
                            <MobileCard
                                key={del.id}
                                badge={del.clave}
                                title={del.nombre}
                                stats={[{ icon: Users, value: del.trabajadores_count, label: 'trabajadores' }]}
                                onClick={() => ctx.selectDel(del)}
                                onEdit={() => openEditDel(del)}
                                onDelete={() => setConfirm({ type: 'del', item: del })}
                            />
                        ))}
                    </MobileLevel>
                )}

                {selDep && selDel && !selTrab && (
                    <MobileLevel
                        title={`Trabajadores — ${selDel.clave}`}
                        subtitle={selDel.nombre}
                        icon={Users}
                        search={trabCtx.search}
                        onSearch={trabCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(3)}
                        loading={trabCtx.loading}
                        empty={trabCtx.data.length === 0}
                        emptyText="Sin trabajadores"
                        emptySub={`en delegación ${selDel.clave}`}
                        onBack={() => ctx.goToLevel(1)}
                        backLabel={selDel.clave}
                    >
                        {trabCtx.data.map((trab) => (
                            <TrabajadorCard
                                key={trab.id}
                                trab={trab}
                                selected={selTrab?.id === trab.id}
                                onClick={() => ctx.selectTrab(trab)}
                            />
                        ))}
                    </MobileLevel>
                )}

                {selDep && selDel && selTrab && (
                    <MobileLevel
                        title={`Programas — ${selTrab.nombre_completo}`}
                        subtitle={`NUE: ${selTrab.nue}`}
                        icon={ClipboardList}
                        search={progCtx.search}
                        onSearch={progCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(4)}
                        loading={progCtx.loading}
                        empty={progCtx.data.length === 0}
                        emptyText="Sin programas"
                        emptySub={`para ${selTrab.nombre_completo}`}
                        onBack={() => ctx.goToLevel(2)}
                        backLabel="Trabajadores"
                    >
                        {progCtx.data.map((prog) => (
                            <ProgramaCard key={prog.id} prog={prog} />
                        ))}
                    </MobileLevel>
                )}
            </div>

            {/* ─── ESCRITORIO: Paneles en cuadrícula ──────────────────────── */}
            <div className="hidden lg:flex flex-col flex-1 min-h-0" style={{ height: 'calc(100vh - 280px)' }}>
                <ExplorerPath
                    selDep={selDep}
                    selDel={selDel}
                    onReset={goToDep}
                    onBackToDep={goBackToDep}
                />

                <div className="grid grid-cols-4 gap-3 flex-1 min-h-0">
                    <Panel
                        title="Dependencias"
                        icon={Building2}
                        count={depCtx.data.length}
                        stepHint="1. Selecciona UR"
                        search={depCtx.search}
                        onSearch={depCtx.setSearch}
                        onAdd={openCreateDep}
                        addLabel="Nueva"
                    >
                        {depCtx.loading ? (
                            <ExplorerSpinner />
                        ) : depCtx.data.length === 0 ? (
                            <ExplorerEmpty icon={Building2} text="Sin dependencias" sub="Crea la primera UR" />
                        ) : (
                            depCtx.data.map((dep) => (
                                <ItemCard
                                    key={dep.id}
                                    item={dep}
                                    selected={selDep?.id === dep.id}
                                    onClick={() => ctx.selectDep(dep)}
                                    onEdit={openEditDep}
                                    onDelete={(item) => setConfirm({ type: 'dep', item })}
                                    stats={[
                                        { icon: UserCheck, value: dep.delegados_count, label: 'delegaciones' },
                                        { icon: Users, value: dep.trabajadores_count, label: 'trabajadores' },
                                    ]}
                                />
                            ))
                        )}
                    </Panel>

                    <Panel
                        title="Delegaciones"
                        icon={UserCheck}
                        count={delCtx.data.length}
                        stepHint="2. Busca o elige delegación"
                        search={delCtx.search}
                        onSearch={delCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(2)}
                        onAdd={selDep ? openCreateDel : null}
                        addLabel="Nueva"
                    >
                        {!selDep && !ctx.panel2Activated && delCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={UserCheck}
                                text="Toca el buscador para cargar"
                                sub="o selecciona una dependencia"
                            />
                        ) : delCtx.loading ? (
                            <ExplorerSpinner />
                        ) : delCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={UserCheck}
                                text="Sin delegaciones"
                                sub={selDep ? `en UR ${selDep.clave}` : 'Prueba otra búsqueda'}
                            />
                        ) : (
                            delCtx.data.map((del) => (
                                <ItemCard
                                    key={del.id}
                                    item={del}
                                    selected={selDel?.id === del.id}
                                    onClick={() => ctx.selectDel(del)}
                                    onEdit={openEditDel}
                                    onDelete={(item) => setConfirm({ type: 'del', item })}
                                    stats={[{ icon: Users, value: del.trabajadores_count, label: 'trabajadores' }]}
                                />
                            ))
                        )}
                    </Panel>

                    <Panel
                        title="Trabajadores"
                        icon={Users}
                        count={trabCtx.data.length}
                        stepHint="3. Busca o elige trabajador"
                        search={trabCtx.search}
                        onSearch={trabCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(3)}
                    >
                        {!selDel && !ctx.panel3Activated && trabCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={Users}
                                text="Toca el buscador para cargar"
                                sub="o selecciona una delegación"
                            />
                        ) : trabCtx.loading ? (
                            <ExplorerSpinner />
                        ) : trabCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={Users}
                                text="Sin trabajadores"
                                sub={selDel ? `en delegación ${selDel.clave}` : 'Prueba otra búsqueda'}
                            />
                        ) : (
                            trabCtx.data.map((trab) => (
                                <TrabajadorCard
                                    key={trab.id}
                                    trab={trab}
                                    selected={selTrab?.id === trab.id}
                                    onClick={() => ctx.selectTrab(trab)}
                                />
                            ))
                        )}
                    </Panel>

                    <Panel
                        title="Programas"
                        icon={ClipboardList}
                        count={progCtx.data.length}
                        stepHint="4. Busca o elige vestuario"
                        search={progCtx.search}
                        onSearch={progCtx.setSearch}
                        onSearchFocus={() => ctx.activatePanel(4)}
                    >
                        {!selTrab && !ctx.panel4Activated && progCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={ClipboardList}
                                text="Toca el buscador para cargar"
                                sub="o selecciona un trabajador"
                            />
                        ) : progCtx.loading ? (
                            <ExplorerSpinner />
                        ) : progCtx.data.length === 0 ? (
                            <ExplorerEmpty
                                icon={ClipboardList}
                                text="Sin programas"
                                sub={selTrab ? `para ${selTrab.nombre_completo}` : 'Selecciona un trabajador'}
                            />
                        ) : (
                            progCtx.data.map((prog) => (
                                <ProgramaCard key={prog.id} prog={prog} />
                            ))
                        )}
                    </Panel>
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!confirm}
                onClose={() => setConfirm(null)}
                type={confirm?.type}
                item={confirm?.item}
                onConfirm={confirm?.type === 'dep' ? deleteDep : deleteDel}
                saving={saving}
            />
        </div>
    );
}
