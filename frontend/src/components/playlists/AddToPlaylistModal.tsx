import { useEffect, useState } from 'react';
import { Check, ListMusic, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { useLibraryStore } from '@/stores/libraryStore';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import type { Track } from '@/types';

interface AddToPlaylistModalProps {
  open: boolean;
  onClose: () => void;
  track: Track | null;
}

export function AddToPlaylistModal({ open, onClose, track }: AddToPlaylistModalProps) {
  const playlists = useLibraryStore((state) => state.playlists);
  const addTrack = useLibraryStore((state) => state.addTrackToPlaylist);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!open) {
      setBusyId(null);
      setCreating(false);
      setNewName('');
    }
  }, [open]);

  const handleAdd = async (playlistId: string) => {
    if (!track) return;
    setBusyId(playlistId);
    try {
      await addTrack(playlistId, track.id);
      toast.success('Added to playlist', track.title);
      onClose();
    } catch (error) {
      toast.error('Could not add track', errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    if (!track) return;
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const id = await createPlaylist({ name });
      await addTrack(id, track.id);
      toast.success('Playlist created', `“${name}” now contains this track.`);
      onClose();
    } catch (error) {
      toast.error('Could not create playlist', errorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to playlist"
      description={track ? `Choose where “${track.title}” should live.` : undefined}
      size="sm"
    >
      <div className="space-y-1.5">
        {playlists.length === 0 && (
          <p className="px-1 py-4 text-center text-[13px] text-bone-500">
            No playlists yet. Create your first one below.
          </p>
        )}
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            type="button"
            disabled={Boolean(busyId)}
            onClick={() => void handleAdd(playlist.id)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-60"
          >
            <CoverArt
              src={playlist.cover_url ?? playlist.preview_covers[0] ?? null}
              title={playlist.name}
              className="h-11 w-11 shrink-0"
              rounded="rounded-lg"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-bone-100">
                {playlist.name}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-bone-500">
                {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
              </span>
            </span>
            {busyId === playlist.id ? (
              <span className="h-4 w-4 animate-spin rounded-full border border-bone-500 border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4 text-bone-500" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
            <ListMusic className="h-4 w-4 shrink-0 text-bone-500" />
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreate();
              }}
              placeholder="New playlist name"
              className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
              maxLength={80}
            />
          </span>
          <Button
            size="sm"
            onClick={() => void handleCreate()}
            loading={creating}
            disabled={!newName.trim()}
          >
            <Check className="h-3.5 w-3.5" />
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}
