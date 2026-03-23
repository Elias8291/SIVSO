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
    DEPENDENCIAS:  '/dashboard/dependencias',
    DEPENDENCIAS_NUEVA:  '/dashboard/dependencias/nueva',
    DEPENDENCIAS_EDITAR: '/dashboard/dependencias/:id/editar',
    DELEGACIONES:  '/dashboard/delegaciones',
    DELEGADOS:     '/dashboard/delegados',
    EMPLEADOS:     '/dashboard/empleados',
    EMPLEADOS_NUEVO:     '/dashboard/empleados/nuevo',
    EMPLEADOS_EDITAR:    '/dashboard/empleados/:id/editar',
    PRODUCTOS:     '/dashboard/productos',
    PRODUCTOS_NUEVO:     '/dashboard/productos/nuevo',
    PRODUCTOS_EDITAR:    '/dashboard/productos/:id/editar',
    PARTIDAS:      '/dashboard/partidas',
    USUARIOS:      '/dashboard/usuarios',
    USUARIOS_NUEVO:      '/dashboard/usuarios/nuevo',
    USUARIOS_EDITAR:     '/dashboard/usuarios/:id/editar',
    ROLES:         '/dashboard/roles',
    ROLES_NUEVO:         '/dashboard/roles/nuevo',
    ROLES_EDITAR:        '/dashboard/roles/:id/editar',
    PERMISOS:      '/dashboard/permisos',
    PERMISOS_NUEVO:      '/dashboard/permisos/nuevo',
    PERMISOS_EDITAR:     '/dashboard/permisos/:id/editar',
    NOTIFICACIONES: '/dashboard/notificaciones',
    PERIODOS: '/dashboard/periodos',
};

/**
 * Secciones del sidebar con sus links agrupados.
 * iconKey debe existir en el ICON_MAP del Sidebar.
 */
/** `permission: null` = cualquier usuario autenticado */
export const SIDEBAR_SECTIONS = [
    {
        label: 'Principal',
        links: [
            { path: ROUTES.DASHBOARD, label: 'Dashboard', iconKey: 'LayoutDashboard', permission: 'ver_dashboard' },
            { path: ROUTES.MI_VESTUARIO, label: 'Mi Vestuario', iconKey: 'Shirt', permission: 'ver_selecciones' },
            { path: ROUTES.MI_DELEGACION, label: 'Mi Delegación', iconKey: 'Building2', permission: 'ver_mi_delegacion' },
            { path: ROUTES.MI_CUENTA, label: 'Mi Cuenta', iconKey: 'User', permission: null },
        ],
    },
    {
        label: 'Vestuario',
        links: [
            { path: ROUTES.EMPLEADOS, label: 'Empleados', iconKey: 'UsersRound', permission: 'ver_empleados' },
            { path: ROUTES.PRODUCTOS, label: 'Productos', iconKey: 'Package', permission: 'ver_catalogo' },
            { path: ROUTES.PARTIDAS, label: 'Partidas', iconKey: 'BarChart2', permission: 'ver_partidas' },
        ],
    },
    {
        label: 'Estructura',
        links: [
            { path: ROUTES.DEPENDENCIAS, label: 'Dependencias', iconKey: 'Building2', permission: 'ver_dependencias' },
            { path: ROUTES.DELEGACIONES, label: 'Delegaciones', iconKey: 'Network', permission: 'ver_delegaciones' },
            { path: ROUTES.DELEGADOS, label: 'Delegados', iconKey: 'UserCheck', permission: 'ver_delegados' },
        ],
    },
    {
        label: 'Administración',
        links: [
            { path: ROUTES.PERIODOS, label: 'Periodos', iconKey: 'Calendar', permission: 'gestionar_periodos' },
            { path: ROUTES.USUARIOS, label: 'Usuarios', iconKey: 'Users', permission: 'gestionar_usuarios' },
            { path: ROUTES.ROLES, label: 'Roles', iconKey: 'Shield', permission: 'gestionar_roles' },
            { path: ROUTES.PERMISOS, label: 'Permisos', iconKey: 'Lock', permission: 'gestionar_permisos' },
        ],
    },
];

/** Alias plano para compatibilidad */
export const SIDEBAR_LINKS = SIDEBAR_SECTIONS.flatMap((s) => s.links);

/** Obtener etiqueta para el Header breadcrumb */
export function getRouteLabel(path) {
    if (path.startsWith('/dashboard/dependencias/nueva')) return 'Nueva Dependencia';
    if (path.match(/^\/dashboard\/dependencias\/\d+\/editar/)) return 'Editar Dependencia';
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
    if (path.startsWith('/dashboard/notificaciones')) return 'Notificaciones';
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
    '/dashboard/dependencias':  'Dependencias',
    '/dashboard/delegaciones':  'Delegaciones',
    '/dashboard/delegados':     'Delegados',
    '/dashboard/partidas':      'Partidas',
    '/dashboard/partidas/limites/editar': 'Editar Límites',
    '/dashboard/usuarios':      'Usuarios',
    '/dashboard/roles':         'Roles',
    '/dashboard/permisos':      'Permisos',
    '/dashboard/notificaciones': 'Notificaciones',
    '/dashboard/periodos':      'Periodos',
};
