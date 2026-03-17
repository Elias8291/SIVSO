import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';

const DEFAULT_META = { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 };

/**
 * Hook para cargar datos paginados con búsqueda server-side y AbortController.
 *
 * @param {string} url      - Endpoint base (ej. '/api/usuarios')
 * @param {object} options  - { perPage, extraData, extra, extraKey }
 *   extraData:  array de claves adicionales del JSON a preservar (ej. ['permisos'])
 *   extra:      objeto con query params adicionales (ej. { dependencia_clave: 'ABC' })
 *   extraKey:   string serializado de `extra` para detectar cambios (JSON.stringify(extra))
 *
 * @returns {{ data, meta, loading, search, setSearch, page, setPage, reload, extra }}
 */
export function usePaginatedApi(url, { perPage = 15, extraData = [], extra: extraParams = {}, extraKey = '' } = {}) {
    const [data, setData]       = useState([]);
    const [meta, setMeta]       = useState(DEFAULT_META);
    const [extra, setExtra]     = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [page, setPage]       = useState(1);
    const [tick, setTick]       = useState(0);  // incrementar para forzar recarga

    const debouncedSearch = useDebounce(search, 380);

    // Reset a página 1 cuando cambia la búsqueda o los filtros extra
    const prevSearch   = useRef(debouncedSearch);
    const prevExtraKey = useRef(extraKey);
    useEffect(() => {
        const searchChanged   = prevSearch.current   !== debouncedSearch;
        const extraKeyChanged = prevExtraKey.current !== extraKey;
        if (searchChanged || extraKeyChanged) {
            prevSearch.current   = debouncedSearch;
            prevExtraKey.current = extraKey;
            setPage(1);
        }
    }, [debouncedSearch, extraKey]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        const params = new URLSearchParams({ page, per_page: perPage });
        if (debouncedSearch) params.set('search', debouncedSearch);
        // Parámetros extra (filtros, etc.)
        for (const [k, v] of Object.entries(extraParams)) {
            if (v !== undefined && v !== null && v !== '') params.set(k, v);
        }

        fetch(`${url}?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => {
                setData(json.data ?? []);
                if (json.meta) setMeta(json.meta);

                // Preserva datos adicionales (ej. permisos en RolesController)
                const extras = {};
                for (const key of extraData) {
                    if (json[key] !== undefined) extras[key] = json[key];
                }
                if (Object.keys(extras).length) setExtra(extras);

                setLoading(false);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') setLoading(false);
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, page, debouncedSearch, perPage, tick, extraKey]);

    /** Fuerza una recarga sin cambiar página ni búsqueda */
    const reload = useCallback(() => setTick((t) => t + 1), []);

    return { data, meta, extra, loading, search, setSearch, page, setPage, reload };
}
