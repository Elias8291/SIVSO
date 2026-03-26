<style>
    :root {
        --err-gold: #AF9460;
        --err-zinc-100: #f4f4f5;
        --err-zinc-200: #e4e4e7;
        --err-zinc-400: #a1a1aa;
        --err-zinc-500: #71717a;
        --err-zinc-700: #3f3f46;
        --err-zinc-900: #18181b;
        --err-accent: var(--err-gold);
    }

    .err-page {
        margin: 0;
        min-height: 100vh;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.5;
        color: var(--err-zinc-900);
        background: var(--err-zinc-100);
        -webkit-font-smoothing: antialiased;
    }

    .err-page.err-page--danger { --err-accent: #dc2626; }
    .err-page.err-page--warn { --err-accent: #d97706; }

    .err-shell {
        max-width: 28rem;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    @media (min-width: 640px) {
        .err-shell {
            padding: 2.5rem 1.5rem 4rem;
            max-width: 32rem;
        }
    }

    .err-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--err-zinc-200);
    }

    .err-brand {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--err-gold);
        text-decoration: none;
    }

    .err-brand:hover {
        opacity: 0.85;
    }

    .err-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .err-card {
        background: #fff;
        border-radius: 1rem;
        border: 1px solid var(--err-zinc-200);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
        padding: 1.5rem 1.25rem;
        border-left: 4px solid var(--err-accent);
    }

    @media (min-width: 640px) {
        .err-card {
            padding: 1.75rem 1.5rem;
        }
    }

    .err-code {
        margin: 0 0 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--err-accent);
    }

    .err-card h1 {
        margin: 0 0 0.75rem;
        font-size: 1.125rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.25;
        color: var(--err-zinc-900);
    }

    .err-desc {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.55;
        color: var(--err-zinc-500);
    }

    .err-footer {
        margin-top: 2rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--err-zinc-200);
        font-size: 0.8125rem;
        color: var(--err-zinc-500);
        text-align: center;
    }

    .err-footer a {
        color: var(--err-gold);
        font-weight: 600;
        text-decoration: none;
    }

    .err-footer a:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .err-footer span {
        margin: 0 0.5rem;
        color: var(--err-zinc-400);
    }
</style>
