import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
export function RequireAuth() {
    const { loading, session } = useAuth();
    const location = useLocation();
    if (loading) {
        return (_jsx("div", { className: "grid h-dvh place-items-center bg-background text-muted-foreground", children: "Opening Saga\u2026" }));
    }
    if (!session) {
        return (_jsx(Navigate, { to: "/login", replace: true, state: { from: `${location.pathname}${location.search}` } }));
    }
    return _jsx(Outlet, {});
}
