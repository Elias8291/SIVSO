import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/main.jsx',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
    esbuild: {
        loader: 'jsx',
        include: /resources\/js\/.*\.jsx$/,
        jsx: 'automatic',
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        outDir: path.resolve(__dirname, 'public/build'), // Carpeta de salida en public
        emptyOutDir: true, // Limpia carpeta antes de build
        manifest: true,      // Crea manifest.json para Laravel Vite Plugin
        rollupOptions: {
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/main.jsx',
            ],
        },
    },
});