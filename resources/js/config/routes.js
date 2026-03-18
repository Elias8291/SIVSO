/**
 * Rutas del panel SIVSO (client-side con React Router)
 * Base path: /dashboard (Laravel ya autenticó)
 */

export const ROUTES = {
    DASHBOARD:     '/dashboard',
    MI_VESTUARIO:  '/dashboard/mi-vestuario',
    MI_CUENTA:     '/dashboard/mi-cuenta',
    MI_CUENTA_CAMBIAR_PASSWORD: '/dashboard/mi-cuenta/cambiar-contrasena',
    ORGANIZACION:  '/dashboard/organizacion',
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

/** Etiquetas para el Header breadcrumb */
export const ROUTE_LABELS = {
    '/dashboard':               'Dashboard',
    '/dashboard/mi-vestuario':  'Mi Vestuario',
    '/dashboard/mi-cuenta':     'Mi Cuenta',
    '/dashboard/mi-cuenta/cambiar-contrasena': 'Cambiar contraseña',
    '/dashboard/empleados':     'Empleados',
    '/dashboard/productos':     'Productos',
    '/dashboard/organizacion':  'Organización',
    '/dashboard/partidas':      'Partidas',
    '/dashboard/usuarios':      'Usuarios',
    '/dashboard/roles':         'Roles',
    '/dashboard/permisos':      'Permisos',
};
