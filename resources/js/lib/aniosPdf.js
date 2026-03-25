/**
 * Años disponibles para PDFs de acuses (ejercicio vigente, próximos y histórico).
 * Se recalcula según el año calendario actual (no queda “congelado” al cargar la página).
 */
export function aniosParaPdfSeleccion() {
    const cy = new Date().getFullYear();
    const list = [];
    for (let y = cy + 2; y >= cy - 30; y -= 1) {
        list.push(y);
    }
    return list;
}

/** Incluye el año del periodo activo aunque no esté en el rango por defecto. */
export function aniosPdfConValorSeleccionado(anios, valor) {
    const v = Number(valor);
    if (!Number.isFinite(v) || v < 1990 || v > 2120) {
        return anios;
    }
    if (anios.includes(v)) {
        return anios;
    }
    return [...anios, v].sort((a, b) => b - a);
}
