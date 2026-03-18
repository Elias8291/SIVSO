/**
 * Hook central para el Explorador Organizacional.
 * Maneja datos, selección en cascada y activación por foco.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../../lib/useDebounce';

function useApiSearch(baseUrl, params = {}, enabled = true) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const debounced = useDebounce(search, 350);
    const paramsKey = JSON.stringify(params);
    const reloadRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            setData([]);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        const qs = new URLSearchParams({ search: debounced, ...params });
        fetch(`${baseUrl}?${qs}`, {
            signal: ctrl.signal,
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((r) => {
                if (!r.ok) throw new Error(r.status);
                return r.json();
            })
            .then((j) => {
                setData(j.data ?? []);
                setLoading(false);
            })
            .catch((e) => {
                if (e.name !== 'AbortError') setLoading(false);
            });
        return () => ctrl.abort();
    }, [baseUrl, debounced, paramsKey, enabled, reloadRef.current]);

    const reload = useCallback(() => { reloadRef.current += 1; }, []);
    return { data, loading, search, setSearch, reload };
}

export function useOrganizacion() {
    const [selDep, setSelDep] = useState(null);
    const [selDel, setSelDel] = useState(null);
    const [selTrab, setSelTrab] = useState(null);
    const [panel2Activated, setPanel2Activated] = useState(false);
    const [panel3Activated, setPanel3Activated] = useState(false);
    const [panel4Activated, setPanel4Activated] = useState(false);

    const depCtx = useApiSearch('/api/dependencias');
    const delCtx = useApiSearch(
        '/api/delegados',
        selDep ? { ur: selDep.clave } : {},
        !!selDep || panel2Activated
    );
    const trabCtx = useApiSearch(
        '/api/trabajadores',
        selDel ? { delegado_id: selDel.id } : {},
        !!selDel || panel3Activated
    );
    const progCtx = useApiSearch(
        '/api/programas',
        selTrab ? { nue: selTrab.nue } : {},
        !!selTrab || panel4Activated
    );

    const selectDep = (dep) => {
        if (selDep?.id === dep.id) {
            setSelDep(null);
            setSelDel(null);
            setSelTrab(null);
        } else {
            setSelDep(dep);
            setSelDel(null);
            setSelTrab(null);
        }
    };

    const selectDel = (del) => {
        if (selDel?.id === del.id) {
            setSelDel(null);
            setSelTrab(null);
        } else {
            setSelDel(del);
            setSelTrab(null);
        }
    };

    const selectTrab = (trab) => {
        if (selTrab?.id === trab.id) setSelTrab(null);
        else setSelTrab(trab);
    };

    const goToLevel = (level) => {
        if (level <= 0) {
            setSelDep(null);
            setSelDel(null);
            setSelTrab(null);
        } else if (level <= 1) {
            setSelDel(null);
            setSelTrab(null);
        } else if (level <= 2) {
            setSelTrab(null);
        }
    };

    const activatePanel = (panel) => {
        if (panel === 2) setPanel2Activated(true);
        if (panel === 3) setPanel3Activated(true);
        if (panel === 4) setPanel4Activated(true);
    };

    return {
        selDep,
        selDel,
        selTrab,
        depCtx,
        delCtx,
        trabCtx,
        progCtx,
        selectDep,
        selectDel,
        selectTrab,
        goToLevel,
        activatePanel,
        panel2Activated,
        panel3Activated,
        panel4Activated,
    };
}
