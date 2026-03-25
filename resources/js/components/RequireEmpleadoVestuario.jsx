import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Vestuario de un colaborador desde /empleados/:id/vestuario:
 * delegados (mi delegación) o usuarios con ver_empleados + ver_productos_empleado.
 */
export default function RequireEmpleadoVestuario({ children }) {
    const { can } = useAuth();
    const ok = can('ver_mi_delegacion') || (can('ver_empleados') && can('ver_productos_empleado'));
    if (!ok) {
        return <Navigate to="/dashboard/mi-cuenta" replace />;
    }
    return children;
}
