import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export function SignedInOnly() {
  const { isAnonymous } = useAuth();
  if (isAnonymous) return <Navigate to="/" replace />;
  return <Outlet />;
}
