import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/pages/SplashScreen';

export function ProtectedRoute() {
  const { session, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) return <SplashScreen />;

  if (!session) {
    const from = `${location.pathname}${location.search}`.replace(/^\/{2,}/, '/');
    return (
      <Navigate
        to="/login"
        replace
        state={{ from }}
      />
    );
  }

  return <Outlet />;
}
