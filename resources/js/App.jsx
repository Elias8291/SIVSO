import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import RequirePermission from './components/RequirePermission';
import LoginPage from './pages/LoginPage';
import CambiarContrasenaPage from './pages/CambiarContrasenaPage';
import {
    DashboardPage,
    MiVestuarioPage,
    MiDelegacionPage,
    MiCuentaPage,
    MiCuentaCambiarContrasenaPage,
    EmpleadosPage,
    EmpleadoFormPage,
    ProductosPage,
    ProductoFormPage,
    UsuariosPage,
    UsuarioFormPage,
    RolesPage,
    RolFormPage,
    PermisosPage,
    PermisoFormPage,
    OrganizacionPage,
    DependenciasPage,
    DelegacionesPage,
    DelegadosPage,
    PartidasPage,
    PartidasLimitePage,
    NotificacionesPage,
    PeriodosPage,
} from './pages';
import { DependenciaFormPage, DelegadoFormPage } from './pages/organizacion';

export default function App({ initialState }) {
    const authValue = initialState
        ? {
            user: initialState.user,
            authenticated: initialState.authenticated,
            logoutUrl: initialState.logoutUrl,
            csrfToken: initialState.csrfToken,
            permissions: initialState.permissions ?? [],
            roles: initialState.roles ?? [],
            logout: () => {
                document.getElementById('logout-form')?.submit();
            },
        }
        : {
            user: null,
            authenticated: false,
            csrfToken: '',
            logoutUrl: null,
            permissions: [],
            roles: [],
            logout: () => {},
        };

    return (
        <AuthProvider value={authValue}>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />

                        <Route path="/dashboard" element={<AppLayout />}>
                            <Route
                                index
                                element={
                                    <RequirePermission permission="ver_dashboard">
                                        <DashboardPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="mi-vestuario"
                                element={
                                    <RequirePermission permission="ver_selecciones">
                                        <MiVestuarioPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="mi-delegacion"
                                element={
                                    <RequirePermission permission="ver_mi_delegacion">
                                        <MiDelegacionPage />
                                    </RequirePermission>
                                }
                            />
                            <Route path="mi-cuenta" element={<MiCuentaPage />} />
                            <Route path="mi-cuenta/cambiar-contrasena" element={<MiCuentaCambiarContrasenaPage />} />

                            <Route
                                path="empleados"
                                element={
                                    <RequirePermission permission="ver_empleados">
                                        <EmpleadosPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="empleados/nuevo"
                                element={
                                    <RequirePermission permission="editar_empleados">
                                        <EmpleadoFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="empleados/:id/editar"
                                element={
                                    <RequirePermission permission="editar_empleados">
                                        <EmpleadoFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="productos"
                                element={
                                    <RequirePermission permission="ver_catalogo">
                                        <ProductosPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="productos/nuevo"
                                element={
                                    <RequirePermission permission="editar_catalogo">
                                        <ProductoFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="productos/:id/editar"
                                element={
                                    <RequirePermission permission="editar_catalogo">
                                        <ProductoFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="organizacion"
                                element={
                                    <RequirePermission
                                        anyOf={['ver_organizacion', 'ver_dependencias', 'ver_delegaciones', 'ver_delegados']}
                                    >
                                        <OrganizacionPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="dependencias"
                                element={
                                    <RequirePermission permission="ver_dependencias">
                                        <DependenciasPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="dependencias/nueva"
                                element={
                                    <RequirePermission permission="editar_dependencias">
                                        <DependenciaFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="dependencias/:id/editar"
                                element={
                                    <RequirePermission permission="editar_dependencias">
                                        <DependenciaFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="delegaciones"
                                element={
                                    <RequirePermission permission="ver_delegaciones">
                                        <DelegacionesPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="delegados"
                                element={
                                    <RequirePermission permission="ver_delegados">
                                        <DelegadosPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="partidas"
                                element={
                                    <RequirePermission permission="ver_partidas">
                                        <PartidasPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="partidas/limites/editar"
                                element={
                                    <RequirePermission permission="editar_partidas">
                                        <PartidasLimitePage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="notificaciones"
                                element={
                                    <RequirePermission permission="ver_notificaciones">
                                        <NotificacionesPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="periodos"
                                element={
                                    <RequirePermission permission="gestionar_periodos">
                                        <PeriodosPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="usuarios"
                                element={
                                    <RequirePermission permission="gestionar_usuarios">
                                        <UsuariosPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="usuarios/nuevo"
                                element={
                                    <RequirePermission permission="gestionar_usuarios">
                                        <UsuarioFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="usuarios/:id/editar"
                                element={
                                    <RequirePermission permission="gestionar_usuarios">
                                        <UsuarioFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="roles"
                                element={
                                    <RequirePermission permission="gestionar_roles">
                                        <RolesPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="roles/nuevo"
                                element={
                                    <RequirePermission permission="gestionar_roles">
                                        <RolFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="roles/:id/editar"
                                element={
                                    <RequirePermission permission="gestionar_roles">
                                        <RolFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route
                                path="permisos"
                                element={
                                    <RequirePermission permission="gestionar_permisos">
                                        <PermisosPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="permisos/nuevo"
                                element={
                                    <RequirePermission permission="gestionar_permisos">
                                        <PermisoFormPage />
                                    </RequirePermission>
                                }
                            />
                            <Route
                                path="permisos/:id/editar"
                                element={
                                    <RequirePermission permission="gestionar_permisos">
                                        <PermisoFormPage />
                                    </RequirePermission>
                                }
                            />

                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>

                        <Route
                            path="/"
                            element={<Navigate to={authValue.authenticated ? '/dashboard' : '/login'} replace />}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}
