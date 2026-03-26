/**
 * Utilidad para llamadas a la API de Laravel (sesión + CSRF).
 */

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.content
    ?? window.sivsoApp?.csrfToken
    ?? '';

/**
 * Si window.sivsoApp.apiBase viene de Laravel (url('/api')), las rutas /api/...
 * apuntan al Laravel correcto aunque la app esté en un subdirectorio.
 */
function resolveApiUrl(url) {
    const base =
        typeof window !== 'undefined' && window.sivsoApp?.apiBase
            ? String(window.sivsoApp.apiBase).replace(/\/$/, '')
            : '';
    if (!base || !url.startsWith('/api')) {
        return url;
    }
    return `${base}${url.slice(4)}`;
}

async function request(method, url, body) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrf(),
        },
        credentials: 'same-origin',
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(resolveApiUrl(url), opts);

    let json;
    try { json = await res.json(); } catch { json = {}; }

    if (json?.must_change_password && typeof window !== 'undefined') {
        window.location.replace('/cambiar-contrasena');
        return;
    }

    if (!res.ok) {
        const message = json?.message ?? json?.error ?? `Error ${res.status}`;
        const errors  = json?.errors ?? null;
        const err = new Error(message);
        err.status = res.status;
        err.errors = errors;
        throw err;
    }

    return json;
}

export { resolveApiUrl };

export const api = {
    get:    (url)         => request('GET',    url),
    post:   (url, data)   => request('POST',   url, data),
    put:    (url, data)   => request('PUT',    url, data),
    patch:  (url, data)   => request('PATCH',  url, data),
    delete: (url)         => request('DELETE', url),
};
