import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
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
    const authValue = initialState ? {
        user:          initialState.user,
        authenticated: initialState.authenticated,
        logoutUrl:     initialState.logoutUrl,
        csrfToken:     initialState.csrfToken,
        logout: () => { document.getElementById('logout-form')?.submit(); },
    } : {
        user: null, authenticated: false, csrfToken: '', logoutUrl: null, logout: () => {},
    };

    return (
        <AuthProvider value={authValue}>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login"             element={<LoginPage />} />
                        <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />

                        <Route path="/dashboard" element={<AppLayout />}>
                            <Route index                  element={<DashboardPage />} />
                            <Route path="mi-vestuario"    element={<MiVestuarioPage />} />
                            <Route path="mi-delegacion"    element={<MiDelegacionPage />} />
                            <Route path="mi-cuenta"       element={<MiCuentaPage />} />
                            <Route path="mi-cuenta/cambiar-contrasena" element={<MiCuentaCambiarContrasenaPage />} />
                            <Route path="empleados"       element={<EmpleadosPage />} />
                            <Route path="empleados/nuevo" element={<EmpleadoFormPage />} />
                            <Route path="empleados/:id/editar" element={<EmpleadoFormPage />} />
                            <Route path="productos"       element={<ProductosPage />} />
                            <Route path="productos/nuevo" element={<ProductoFormPage />} />
                            <Route path="productos/:id/editar" element={<ProductoFormPage />} />
                            <Route path="organizacion" element={<OrganizacionPage />} />
                            <Route path="dependencias"       element={<DependenciasPage />} />
                            <Route path="dependencias/nueva" element={<DependenciaFormPage />} />
                            <Route path="dependencias/:id/editar" element={<DependenciaFormPage />} />
                            <Route path="delegaciones"       element={<DelegacionesPage />} />
                            <Route path="delegados"          element={<DelegadosPage />} />
                            <Route path="partidas"        element={<PartidasPage />} />
                            <Route path="partidas/limites/editar" element={<PartidasLimitePage />} />
                            <Route path="notificaciones" element={<NotificacionesPage />} />
                            <Route path="periodos" element={<PeriodosPage />} />
                            <Route path="usuarios"        element={<UsuariosPage />} />
                            <Route path="usuarios/nuevo"  element={<UsuarioFormPage />} />
                            <Route path="usuarios/:id/editar" element={<UsuarioFormPage />} />
                            <Route path="roles"           element={<RolesPage />} />
                            <Route path="roles/nuevo"     element={<RolFormPage />} />
                            <Route path="roles/:id/editar" element={<RolFormPage />} />
                            <Route path="permisos"        element={<PermisosPage />} />
                            <Route path="permisos/nuevo"  element={<PermisoFormPage />} />
                            <Route path="permisos/:id/editar" element={<PermisoFormPage />} />
                            <Route path="*"               element={<Navigate to="/dashboard" replace />} />
                        </Route>

                        <Route path="/" element={<Navigate to={authValue.authenticated ? '/dashboard' : '/login'} replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}
