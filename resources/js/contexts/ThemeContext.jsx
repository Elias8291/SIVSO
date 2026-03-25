import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'sivso-theme';

function readInitialDark() {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark') {
            return true;
        }
        if (stored === 'light') {
            return false;
        }
    } catch {
        /* ignorar */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(readInitialDark);

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
        } catch {
            /* modo privado u otro bloqueo */
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode: isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        return {
            isDarkMode: false,
            toggleTheme: () => { },
        };
    }
    return context;
}
