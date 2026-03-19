/**
 * Rutas del panel SIVSO (client-side con React Router)
 * Base path: /dashboard (Laravel ya autenticó)
 */

export const ROUTES = {
    DASHBOARD:     '/dashboard',
    MI_VESTUARIO:  '/dashboard/mi-vestuario',
    MI_DELEGACION: '/dashboard/mi-delegacion',
    MI_CUENTA:     '/dashboard/mi-cuenta',
    MI_CUENTA_CAMBIAR_PASSWORD: '/dashboard/mi-cuenta/cambiar-contrasena',
    ORGANIZACION:  '/dashboard/organizacion',
    ORGANIZACION_DEP_NUEVA:   '/dashboard/organizacion/dependencias/nueva',
    ORGANIZACION_DEP_EDITAR:  '/dashboard/organizacion/dependencias/:id/editar',
    ORGANIZACION_DEL_NUEVO:   '/dashboard/organizacion/delegados/nuevo',
    ORGANIZACION_DEL_EDITAR:  '/dashboard/organizacion/delegados/:id/editar',
    EMPLEADOS_NUEVO:         '/dashboard/empleados/nuevo',
    EMPLEADOS_EDITAR:        '/dashboard/empleados/:id/editar',
    PRODUCTOS_NUEVO:         '/dashboard/productos/nuevo',
    PRODUCTOS_EDITAR:        '/dashboard/productos/:id/editar',
    USUARIOS_NUEVO:          '/dashboard/usuarios/nuevo',
    USUARIOS_EDITAR:         '/dashboard/usuarios/:id/editar',
    ROLES_NUEVO:             '/dashboard/roles/nuevo',
    ROLES_EDITAR:            '/dashboard/roles/:id/editar',
    PERMISOS_NUEVO:          '/dashboard/permisos/nuevo',
    PERMISOS_EDITAR:         '/dashboard/permisos/:id/editar',
    DELEGADOS:     '/dashboard/delegados',
    PARTIDAS:      '/dashboard/partidas',
    EMPLEADOS:     '/dashboard/empleados',
    PRODUCTOS:     '/dashboard/productos',
    USUARIOS:      '/dashboard/usuarios',
    ROLES:         '/dashboard/roles',
    PERMISOS:      '/dashboard/permisos',
};

/**
 * Secciones del sidebar con sus links agrupados.
 * iconKey debe existir en el ICON_MAP del Sidebar.
 */
export const SIDEBAR_SECTIONS = [
    {
        label: 'Principal',
        links: [
            { path: ROUTES.DASHBOARD,    label: 'Dashboard',      iconKey: 'LayoutDashboard' },
            { path: ROUTES.MI_VESTUARIO, label: 'Mi Vestuario',   iconKey: 'Shirt' },
            { path: ROUTES.MI_DELEGACION, label: 'Mi Delegación', iconKey: 'Building2' },
            { path: ROUTES.MI_CUENTA,    label: 'Mi Cuenta',      iconKey: 'User' },
        ],
    },
    {
        label: 'Vestuario',
        links: [
            { path: ROUTES.EMPLEADOS, label: 'Empleados', iconKey: 'UsersRound' },
            { path: ROUTES.PRODUCTOS, label: 'Productos',  iconKey: 'Package' },
            { path: ROUTES.PARTIDAS,  label: 'Partidas',   iconKey: 'BarChart2' },
        ],
    },
    {
        label: 'Estructura',
        links: [
            { path: ROUTES.ORGANIZACION, label: 'Organización', iconKey: 'Network' },
            { path: ROUTES.DELEGADOS,    label: 'Delegados',    iconKey: 'UserCheck' },
        ],
    },
    {
        label: 'Administración',
        links: [
            { path: ROUTES.USUARIOS, label: 'Usuarios', iconKey: 'Users' },
            { path: ROUTES.ROLES,    label: 'Roles',    iconKey: 'Shield' },
            { path: ROUTES.PERMISOS, label: 'Permisos', iconKey: 'Lock' },
        ],
    },
];

/** Alias plano para compatibilidad */
export const SIDEBAR_LINKS = SIDEBAR_SECTIONS.flatMap((s) => s.links);

/** Obtener etiqueta para el Header breadcrumb */
export function getRouteLabel(path) {
    if (path.startsWith('/dashboard/organizacion/dependencias/nueva')) return 'Nueva Dependencia';
    if (path.match(/^\/dashboard\/organizacion\/dependencias\/\d+\/editar/)) return 'Editar Dependencia';
    if (path.startsWith('/dashboard/organizacion/delegados/nuevo')) return 'Nuevo Delegado';
    if (path.match(/^\/dashboard\/organizacion\/delegados\/\d+\/editar/)) return 'Editar Delegado';
    if (path.startsWith('/dashboard/empleados/nuevo')) return 'Nuevo Empleado';
    if (path.match(/^\/dashboard\/empleados\/\d+\/editar/)) return 'Editar Empleado';
    if (path.startsWith('/dashboard/productos/nuevo')) return 'Nuevo Producto';
    if (path.match(/^\/dashboard\/productos\/\d+\/editar/)) return 'Editar Producto';
    if (path.startsWith('/dashboard/usuarios/nuevo')) return 'Nuevo Usuario';
    if (path.match(/^\/dashboard\/usuarios\/\d+\/editar/)) return 'Editar Usuario';
    if (path.startsWith('/dashboard/roles/nuevo')) return 'Nuevo Rol';
    if (path.match(/^\/dashboard\/roles\/\d+\/editar/)) return 'Editar Rol';
    if (path.startsWith('/dashboard/permisos/nuevo')) return 'Nuevo Permiso';
    if (path.match(/^\/dashboard\/permisos\/\d+\/editar/)) return 'Editar Permiso';
    if (path.startsWith('/dashboard/partidas/limites/editar')) return 'Editar Límites';
    return ROUTE_LABELS[path] ?? 'Dashboard';
}

/** Etiquetas para el Header breadcrumb */
export const ROUTE_LABELS = {
    '/dashboard':               'Dashboard',
    '/dashboard/mi-vestuario':  'Mi Vestuario',
    '/dashboard/mi-delegacion': 'Mi Delegación',
    '/dashboard/mi-cuenta':     'Mi Cuenta',
    '/dashboard/mi-cuenta/cambiar-contrasena': 'Cambiar contraseña',
    '/dashboard/empleados':     'Empleados',
    '/dashboard/productos':     'Productos',
    '/dashboard/organizacion':  'Organización',
    '/dashboard/delegados':     'Delegados',
    '/dashboard/partidas':      'Partidas',
    '/dashboard/partidas/limites/editar': 'Editar Límites',
    '/dashboard/usuarios':      'Usuarios',
    '/dashboard/roles':         'Roles',
    '/dashboard/permisos':      'Permisos',
};
