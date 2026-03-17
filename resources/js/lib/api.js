/**
 * Utilidad para llamadas a la API de Laravel (sesión + CSRF).
 */

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.content
    ?? window.sivsoApp?.csrfToken
    ?? '';

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

    const res = await fetch(url, opts);

    let json;
    try { json = await res.json(); } catch { json = {}; }

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

export const api = {
    get:    (url)         => request('GET',    url),
    post:   (url, data)   => request('POST',   url, data),
    put:    (url, data)   => request('PUT',    url, data),
    patch:  (url, data)   => request('PATCH',  url, data),
    delete: (url)         => request('DELETE', url),
};
