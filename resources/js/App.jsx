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
    ProductosPage,
    UsuariosPage,
    RolesPage,
    PermisosPage,
    OrganizacionPage,
    DelegadosPage,
    PartidasPage,
} from './pages';

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
                            <Route path="productos"       element={<ProductosPage />} />
                            <Route path="organizacion"    element={<OrganizacionPage />} />
                            <Route path="delegados"      element={<DelegadosPage />} />
                            <Route path="partidas"        element={<PartidasPage />} />
                            <Route path="usuarios"        element={<UsuariosPage />} />
                            <Route path="roles"           element={<RolesPage />} />
                            <Route path="permisos"        element={<PermisosPage />} />
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
