import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que deja de cambiar.
 * @param {*}      value  - Valor a debounce
 * @param {number} delay  - Milisegundos de espera (default 400)
 */
export function useDebounce(value, delay = 400) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
