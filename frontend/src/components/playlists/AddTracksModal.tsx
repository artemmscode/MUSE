import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLibraryStore } from '@/stores/libraryStore';
import { formatDuration } from '@/lib/format';
import type { PlaylistWithTracks } from '@/types';

interface AddTracksModalProps {
  open: boolean;
  onClose: () => void;
  playlist: PlaylistWithTracks;
  onAdd: (trackId: string) => Promise<void>;
}

export function AddTracksModal({ open, onClose, playlist, onAdd }: AddTracksModalProps) {
  const tracks = useLibraryStore((state) => state.tracks);
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const existing = useMemo(
    () => new Set(playlist.tracks.map((track) => track.id)),
    [playlist.tracks],
  );

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return tracks;
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(clean) ||
        track.artist.toLowerCase().includes(clean) ||
        (track.album ?? '').toLowerCase().includes(clean),
    );
  }, [query, tracks]);

  const handleAdd = async (trackId: string) => {
    setBusyId(trackId);
    try {
      await onAdd(trackId);
      setAdded((previous) => new Set(previous).add(trackId));
    } catch {
      // The parent surfaces the error as a toast.
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add tracks"
      description={`Search your library and add tracks to “${playlist.name}”.`}
      size="lg"
    >
      <div className="mb-4 flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5">
        <Search className="h-4 w-4 shrink-0 text-bone-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, artist or album"
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No tracks found"
          description="Try a different search, or add music through the Telegram bot."
          compact
          className="border-0 bg-transparent"
        />
      ) : (
        <div className="max-h-[52dvh] space-y-0.5 overflow-y-auto pr-1">
          {filtered.map((track) => {
            const isAdded = existing.has(track.id) || added.has(track.id);
            return (
              <div
                key={track.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.035]"
              >
                <CoverArt
                  src={track.cover_url}
                  title={track.title}
                  artist={track.artist}
                  className="h-10 w-10 shrink-0"
                  rounded="rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-bone-100">
                    {track.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-bone-500">
                    {track.artist} · {formatDuration(track.duration)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAdded || busyId === track.id}
                  onClick={() => void handleAdd(track.id)}
                  aria-label={isAdded ? 'Already added' : `Add ${track.title}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-bone-300 transition-colors hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-bone-50 disabled:opacity-50"
                >
                  {isAdded ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  ) : busyId === track.id ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-bone-500 border-t-transparent" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
