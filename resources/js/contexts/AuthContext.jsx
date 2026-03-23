import React, { createContext, useContext, useMemo } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, value }) {
    const merged = useMemo(() => {
        const permissions = value?.permissions ?? [];
        const can = (name) => {
            if (!name) return true;
            return permissions.includes(name);
        };
        const canAny = (names) => {
            if (!names?.length) return true;
            return names.some((n) => permissions.includes(n));
        };
        const canAll = (names) => {
            if (!names?.length) return true;
            return names.every((n) => permissions.includes(n));
        };
        return { ...value, permissions, can, canAny, canAll };
    }, [value]);

    return (
        <AuthContext.Provider value={merged}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        return {
            user: { name: 'Admin Oaxaca', email: 'admin@sivso.gob' },
            logoutUrl: '/logout',
            csrfToken: '',
            permissions: [],
            roles: [],
            can: () => true,
            canAny: () => true,
            canAll: () => true,
        };
    }
    return context;
}
