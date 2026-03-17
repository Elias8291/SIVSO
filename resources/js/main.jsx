import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const container = document.getElementById('root');
if (container) {
    const initialState = typeof window !== 'undefined' ? window.sivsoApp : null;
    createRoot(container).render(
        <React.StrictMode>
            <App initialState={initialState} />
        </React.StrictMode>
    );
}
