import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '@/src/App';
import '@/src/index.css';
const root = document.getElementById('root');
if (!root)
    throw new Error('Root element missing');
createRoot(root).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
        void navigator.serviceWorker.register('/sw.js');
    }
    else {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations)
                void registration.unregister();
        });
    }
}
