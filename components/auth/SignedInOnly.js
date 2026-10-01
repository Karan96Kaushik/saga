import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
export function SignedInOnly() {
    const { isAnonymous } = useAuth();
    if (isAnonymous)
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(Outlet, {});
}
