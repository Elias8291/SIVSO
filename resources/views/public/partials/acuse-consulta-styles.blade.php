<style>
    :root {
        --acus-gold: #AF9460;
        --acus-gold-soft: rgb(175 148 96 / 0.12);
        --acus-zinc-50: #fafafa;
        --acus-zinc-100: #f4f4f5;
        --acus-zinc-200: #e4e4e7;
        --acus-zinc-300: #d4d4d8;
        --acus-zinc-500: #71717a;
        --acus-zinc-700: #3f3f46;
        --acus-zinc-900: #18181b;
        --acus-ok: #059669;
        --acus-ok-bg: #ecfdf5;
        --acus-bad: #c2410c;
        --acus-bad-bg: #fff7ed;
    }

    .acus-consulta {
        margin: 0;
        min-height: 100vh;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.5;
        color: var(--acus-zinc-900);
        background: var(--acus-zinc-100);
        -webkit-font-smoothing: antialiased;
    }

    .acus-shell {
        max-width: 42rem;
        margin: 0 auto;
        padding: 1.25rem 1rem 3rem;
    }

    @media (min-width: 640px) {
        .acus-shell {
            padding: 2rem 1.5rem 4rem;
        }
    }

    .acus-header {
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--acus-zinc-200);
    }

    .acus-brand {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .acus-brand-mark {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--acus-gold);
    }

    .acus-brand-sub {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--acus-zinc-700);
        letter-spacing: -0.02em;
    }

    .acus-verif {
        border-radius: 0.75rem;
        padding: 0.9rem 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--acus-zinc-200);
        background: #fff;
        border-left-width: 4px;
        border-left-style: solid;
    }

    .acus-verif--ok {
        border-left-color: var(--acus-ok);
        background: var(--acus-ok-bg);
        border-color: rgb(16 185 129 / 0.25);
    }

    .acus-verif--bad {
        border-left-color: var(--acus-bad);
        background: var(--acus-bad-bg);
        border-color: rgb(234 88 12 / 0.25);
    }

    .acus-verif--neutral {
        border-left-color: var(--acus-gold);
        background: var(--acus-zinc-50);
    }

    .acus-verif-label {
        margin: 0 0 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--acus-zinc-500);
    }

    .acus-verif--ok .acus-verif-label { color: var(--acus-ok); }
    .acus-verif--bad .acus-verif-label { color: var(--acus-bad); }
    .acus-verif--neutral .acus-verif-label { color: var(--acus-gold); }

    .acus-verif-text {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--acus-zinc-700);
    }

    .acus-card {
        background: #fff;
        border-radius: 1rem;
        border: 1px solid var(--acus-zinc-200);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
        padding: 1.25rem 1rem 1.5rem;
    }

    @media (min-width: 640px) {
        .acus-card {
            padding: 1.5rem 1.5rem 2rem;
        }
    }

    /* Documento: tipografía legible (sustituye estilos PDF) */
    .acus-consulta .acuse-web-doc {
        font-size: 13px;
        line-height: 1.45;
        color: var(--acus-zinc-900);
    }

    .acus-consulta .acuse-web-doc .center { text-align: center; }

    .acus-consulta .acuse-web-doc .title-main {
        font-size: 0.95rem;
        font-weight: 700;
        text-transform: uppercase;
        margin: 0 0 0.25rem;
        line-height: 1.25;
        letter-spacing: 0.02em;
    }

    .acus-consulta .acuse-web-doc .title-sub {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        margin: 0.15rem 0 0;
        line-height: 1.35;
        color: var(--acus-zinc-700);
    }

    .acus-consulta .acuse-web-doc .warn {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        margin: 0;
        padding: 0 0 0.35rem;
        text-align: center;
        line-height: 1.35;
        color: var(--acus-zinc-700);
    }

    .acus-consulta .acuse-web-doc .cabecera-acuse {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 0.5rem;
    }

    .acus-consulta .acuse-web-doc .cabecera-acuse td {
        vertical-align: top;
        padding: 0;
    }

    .acus-consulta .acuse-web-doc .cabecera-acuse .celda-aviso {
        padding-bottom: 0.5rem;
    }

    .acus-consulta .acuse-web-doc .celda-folio {
        padding: 0.35rem 0 0.15rem;
        text-align: center;
    }

    .acus-consulta .acuse-web-doc .folio {
        font-size: 0.8rem;
        font-weight: 700;
        margin: 0.35rem 0 0.85rem;
        line-height: 1.3;
        color: var(--acus-zinc-900);
    }

    .acus-consulta .acuse-web-doc .datos {
        width: 100%;
        margin: 0.75rem 0 1rem;
        border-collapse: collapse;
    }

    .acus-consulta .acuse-web-doc .datos td {
        padding: 0.4rem 0;
        vertical-align: top;
        font-size: 0.8rem;
        line-height: 1.4;
        border-bottom: 1px solid var(--acus-zinc-100);
    }

    .acus-consulta .acuse-web-doc .datos .k {
        font-weight: 700;
        width: 32%;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.04em;
        color: var(--acus-zinc-500);
        padding-right: 0.75rem;
    }

    .acus-consulta .acuse-web-doc .datos td:not(.k) {
        font-weight: 600;
        text-transform: uppercase;
        color: var(--acus-zinc-900);
    }

    .acus-consulta .acuse-web-doc .valor-regla {
        border-bottom: 1px solid var(--acus-zinc-300);
        padding: 0 0 0.2rem 0.5rem;
    }

    .acus-consulta .acuse-web-doc table.items {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.72rem;
    }

    .acus-consulta .acuse-web-doc table.items th {
        border: 1px solid var(--acus-zinc-200);
        padding: 0.45rem 0.4rem;
        background: var(--acus-zinc-50);
        text-transform: uppercase;
        font-weight: 700;
        line-height: 1.2;
        color: var(--acus-zinc-700);
    }

    .acus-consulta .acuse-web-doc table.items td {
        border: 1px solid var(--acus-zinc-200);
        padding: 0.35rem 0.4rem;
        vertical-align: top;
        line-height: 1.35;
    }

    .acus-consulta .acuse-web-doc table.items td.num,
    .acus-consulta .acuse-web-doc table.items td.talla,
    .acus-consulta .acuse-web-doc table.items td.cant {
        text-align: center;
        white-space: nowrap;
    }

    .acus-consulta .acuse-web-doc .total-row td {
        font-weight: 700;
        border: 1px solid var(--acus-zinc-200);
        padding: 0.45rem 0.4rem;
    }

    .acus-consulta .acuse-web-doc .pie-anio {
        margin-top: 0.75rem;
        font-size: 0.72rem;
        color: var(--acus-zinc-500);
    }

    .acus-consulta .acuse-web-doc .firmas-wrap {
        margin-top: 1.5rem;
        width: 100%;
    }

    .acus-consulta .acuse-web-doc .firmas-table td {
        vertical-align: top;
        text-align: center;
        width: 46%;
        padding: 0 0.5rem;
    }

    .acus-consulta .acuse-web-doc .firma-linea {
        border-bottom: 1px solid var(--acus-zinc-900);
        min-height: 2rem;
        margin-bottom: 0.35rem;
    }

    .acus-consulta .acuse-web-doc .firma-nombre {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        margin: 0 0 0.15rem;
    }

    .acus-consulta .acuse-web-doc .firma-rol {
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--acus-zinc-500);
        margin: 0;
    }

    .acus-footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--acus-zinc-200);
        text-align: center;
    }

    .acus-footer p {
        margin: 0;
        font-size: 0.72rem;
        line-height: 1.45;
        color: var(--acus-zinc-500);
        max-width: 28rem;
        margin-left: auto;
        margin-right: auto;
    }
</style>
