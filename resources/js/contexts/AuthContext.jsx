import React, { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, value }) {
    return (
        <AuthContext.Provider value={value}>
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
        };
    }
    return context;
}
