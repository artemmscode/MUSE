import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth, useAuthBootstrap } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/env';
import { SplashScreen } from '@/pages/SplashScreen';
import { ConfigScreen } from '@/pages/ConfigScreen';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { RecentPage } from '@/pages/RecentPage';
import { PlaylistsPage } from '@/pages/PlaylistsPage';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { SearchPage } from '@/pages/SearchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TrackPage } from '@/pages/TrackPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * React Router wants a leading slash and no trailing slash.
 * Vite's BASE_URL is `/` or `/MUSE/`.
 */
const routerBasename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

function LoginRoute() {
  const { session, loading, initialized } = useAuth();
  if (loading || !initialized) return <SplashScreen />;
  if (session) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  useAuthBootstrap();

  if (!isSupabaseConfigured) {
    return (
      <ErrorBoundary>
        <ConfigScreen />
        <Toaster />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="recent" element={<RecentPage />} />
              <Route path="playlists" element={<PlaylistsPage />} />
              <Route path="playlists/:id" element={<PlaylistPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="track/:id" element={<TrackPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
