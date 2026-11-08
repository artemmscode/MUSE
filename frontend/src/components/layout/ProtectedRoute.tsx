import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/pages/SplashScreen';

export function ProtectedRoute() {
  const { session, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) return <SplashScreen />;

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
