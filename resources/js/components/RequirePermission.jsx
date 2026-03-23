import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * @param {string} [permission] — un permiso requerido
 * @param {string[]} [anyOf] — al menos uno
 * @param {string[]} [allOf] — todos
 */
export default function RequirePermission({ permission, anyOf, allOf, children }) {
    const { can, canAny, canAll } = useAuth();

    let ok = true;
    if (permission) ok = ok && can(permission);
    if (anyOf?.length) ok = ok && canAny(anyOf);
    if (allOf?.length) ok = ok && canAll(allOf);

    if (!ok) {
        return <Navigate to="/dashboard/mi-cuenta" replace />;
    }

    return children;
}
