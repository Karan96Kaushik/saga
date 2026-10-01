import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from 'next-themes';
import { Navigate, Route, Routes } from 'react-router';
import { LoginView } from '@/components/auth/LoginView';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ResetPasswordView } from '@/components/auth/ResetPasswordView';
import { SignedInOnly } from '@/components/auth/SignedInOnly';
import { FilesView } from '@/components/files/FilesView';
import { AppShell } from '@/components/layout/AppShell';
import { NotesView } from '@/components/notes/NotesView';
import { SettingsView } from '@/components/settings/SettingsView';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { FilesProvider } from '@/hooks/useFiles';
import { NotesProvider } from '@/hooks/useNotes';
export function App() {
    return (_jsx(ThemeProvider, { attribute: "class", defaultTheme: "light", enableSystem: false, storageKey: "saga-theme", children: _jsx(TooltipProvider, { children: _jsx(AuthProvider, { children: _jsx(FilesProvider, { children: _jsxs(NotesProvider, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginView, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordView, {}) }), _jsx(Route, { element: _jsx(RequireAuth, {}), children: _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { index: true, element: _jsx(NotesView, {}) }), _jsx(Route, { path: "notebooks/:notebookId", element: _jsx(NotesView, {}) }), _jsx(Route, { path: "tags/:tagId", element: _jsx(NotesView, {}) }), _jsx(Route, { path: "unfiled", element: _jsx(NotesView, {}) }), _jsx(Route, { path: "trash", element: _jsx(NotesView, {}) }), _jsx(Route, { path: "files", element: _jsx(FilesView, {}) }), _jsx(Route, { element: _jsx(SignedInOnly, {}), children: _jsx(Route, { path: "settings", element: _jsx(SettingsView, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }), _jsx(Toaster, { position: "bottom-center" }), import.meta.env.PROD ? _jsx(Analytics, {}) : null] }) }) }) }) }));
}
