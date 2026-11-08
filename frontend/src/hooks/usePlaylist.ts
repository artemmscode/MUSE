import { useCallback, useEffect, useState } from 'react';
import { fetchPlaylist } from '@/services/playlists';
import { errorMessage } from '@/lib/errors';
import type { PlaylistWithTracks } from '@/types';

export function usePlaylist(id: string | undefined): {
  playlist: PlaylistWithTracks | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Playlist not found.');
      return;
    }
    try {
      setError(null);
      const data = await fetchPlaylist(id);
      setPlaylist(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this playlist.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  return { playlist, loading, error, refresh };
}
