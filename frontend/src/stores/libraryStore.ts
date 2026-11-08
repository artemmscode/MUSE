import { create } from 'zustand';
import type { PlaylistSummary, Track } from '@/types';
import {
  createPlaylist as createPlaylistService,
  deletePlaylist as deletePlaylistService,
  fetchPlaylists,
  updatePlaylist as updatePlaylistService,
  addTrackToPlaylist as addTrackToPlaylistService,
  removeTrackFromPlaylist as removeTrackFromPlaylistService,
  reorderPlaylistTracks as reorderPlaylistTracksService,
} from '@/services/playlists';
import { deleteTrack as deleteTrackService, fetchTracks } from '@/services/tracks';
import { errorMessage } from '@/lib/errors';

interface LibraryState {
  tracks: Track[];
  playlists: PlaylistSummary[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSyncedAt: number | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  deleteTrack: (track: Track) => Promise<void>;
  createPlaylist: (input: {
    name: string;
    description?: string | null;
    cover_url?: string | null;
  }) => Promise<string>;
  updatePlaylist: (
    id: string,
    patch: { name?: string; description?: string | null; cover_url?: string | null },
  ) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) => Promise<void>;
  clearError: () => void;
}

let inFlight: Promise<void> | null = null;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  playlists: [],
  loading: true,
  refreshing: false,
  error: null,
  lastSyncedAt: null,

  refresh: (options) => {
    if (inFlight) return inFlight;

    const silent = options?.silent ?? false;
    set(silent ? { refreshing: true } : { loading: true, error: null });

    inFlight = (async () => {
      try {
        const [tracks, playlists] = await Promise.all([fetchTracks(), fetchPlaylists()]);
        set({
          tracks,
          playlists,
          loading: false,
          refreshing: false,
          error: null,
          lastSyncedAt: Date.now(),
        });
      } catch (error) {
        set({
          loading: false,
          refreshing: false,
          error: errorMessage(error, 'Could not load your library.'),
        });
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  deleteTrack: async (track) => {
    await deleteTrackService(track);
    set((state) => ({
      tracks: state.tracks.filter((item) => item.id !== track.id),
    }));
    await get().refresh({ silent: true });
  },

  createPlaylist: async (input) => {
    const id = await createPlaylistService(input);
    await get().refresh({ silent: true });
    return id;
  },

  updatePlaylist: async (id, patch) => {
    await updatePlaylistService(id, patch);
    await get().refresh({ silent: true });
  },

  deletePlaylist: async (id) => {
    await deletePlaylistService(id);
    set((state) => ({ playlists: state.playlists.filter((item) => item.id !== id) }));
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    await addTrackToPlaylistService(playlistId, trackId);
    await get().refresh({ silent: true });
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    await removeTrackFromPlaylistService(playlistId, trackId);
    await get().refresh({ silent: true });
  },

  reorderPlaylistTracks: async (playlistId, trackIds) => {
    await reorderPlaylistTracksService(playlistId, trackIds);
    await get().refresh({ silent: true });
  },

  clearError: () => set({ error: null }),
}));
