import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';
import { PlayerProvider } from '@/player/PlayerProvider';
import { PlayerBar } from '@/player/PlayerBar';
import { NowPlayingSheet } from '@/player/NowPlayingSheet';
import { QueuePanel } from '@/player/QueuePanel';
import { useAuth } from '@/hooks/useAuth';
import { useLibrarySync } from '@/hooks/useLibrarySync';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTelegram } from '@/hooks/useTelegram';
import { setTelegramBackButton } from '@/services/telegram';
import { useLibraryStore } from '@/stores/libraryStore';
import { Button } from '@/components/ui/Button';

function LibraryErrorBanner() {
  const error = useLibraryStore((state) => state.error);
  const refresh = useLibraryStore((state) => state.refresh);
  const loading = useLibraryStore((state) => state.loading);

  if (!error) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#5a2a2a]/50 bg-[#2a1717]/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e0a7a7]" />
        <div>
          <p className="text-[12.5px] font-medium text-[#f0c9c9]">Library could not be synced</p>
          <p className="mt-0.5 text-[11.5px] text-bone-500">{error}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        loading={loading}
        onClick={() => void refresh()}
        className="shrink-0"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMiniApp } = useTelegram();

  useLibrarySync(user?.id);
  useKeyboardShortcuts();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMiniApp) return;
    const isRoot = location.pathname === '/';
    return setTelegramBackButton(!isRoot, () => navigate(-1));
  }, [isMiniApp, location.pathname, navigate]);

  return (
    <PlayerProvider>
      <div className="min-h-dvh">
        <Sidebar />
        <div className="min-h-dvh lg:pl-[var(--sidebar-width)]">
          <TopBar />
          <main className="mx-auto w-full max-w-[1500px] px-4 pb-[calc(var(--player-height)+var(--mobile-nav-height)+var(--safe-bottom)+var(--tg-safe-bottom)+32px)] pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-[calc(var(--player-height)+var(--safe-bottom)+var(--tg-safe-bottom)+44px)] lg:pt-9">
            <LibraryErrorBanner />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <MobileNav />
        <PlayerBar />
        <NowPlayingSheet />
        <QueuePanel />
      </div>
    </PlayerProvider>
  );
}
