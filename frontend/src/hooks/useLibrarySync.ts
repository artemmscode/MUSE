import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { useLibraryStore } from '@/stores/libraryStore';

/**
 * One realtime subscription for the whole app.
 * Realtime is a fast path; focus refresh and a 60s poll are the safety net.
 */
export function useLibrarySync(userId: string | undefined): void {
  const refresh = useLibraryStore((state) => state.refresh);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    void refresh();

    const scheduleRefresh = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void refresh({ silent: true });
      }, 350);
    };

    const channel = supabase
      .channel(`muse-library-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracks' },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlists' },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlist_tracks' },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Polling and focus refresh keep the library in sync without Realtime.
          console.info('MUSE realtime unavailable; falling back to polling.');
        }
      });

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true });
      }
    }, env.syncIntervalMs);

    const onFocus = () => {
      void refresh({ silent: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true });
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);
}
