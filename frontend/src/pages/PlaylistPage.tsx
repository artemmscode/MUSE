import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import {
  ArrowLeft,
  Disc3,
  GripVertical,
  ListMusic,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlaylistCover } from '@/components/playlists/PlaylistCover';
import { PlaylistFormModal } from '@/components/playlists/PlaylistFormModal';
import { AddTracksModal } from '@/components/playlists/AddTracksModal';
import { TrackRow } from '@/components/track/TrackRow';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/toastStore';
import { uploadPlaylistCover } from '@/services/storage';
import { errorMessage } from '@/lib/errors';
import { formatTotalDuration } from '@/lib/format';
import type { Track } from '@/types';

function PlaylistTrackItem({
  track,
  index,
  queue,
  onRemove,
}: {
  track: Track;
  index: number;
  queue: Track[];
  onRemove: (track: Track) => Promise<void>;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      as="div"
      whileDrag={{ scale: 1.005, opacity: 0.9 }}
      className="relative flex items-center gap-1 rounded-xl"
    >
      <button
        type="button"
        aria-label={`Reorder ${track.title}`}
        onPointerDown={(event) => controls.start(event)}
        className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-bone-600 transition-colors hover:text-bone-300 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <TrackRow
          track={track}
          queue={queue}
          index={index}
          showAlbum={false}
          showSource={false}
          onRemoveFromPlaylist={onRemove}
          leading={
            <span className="text-[11px] tabular-nums text-bone-600">
              {String(index + 1).padStart(2, '0')}
            </span>
          }
        />
      </div>
    </Reorder.Item>
  );
}

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playlist, loading, error, refresh } = usePlaylist(id);
  const updatePlaylist = useLibraryStore((state) => state.updatePlaylist);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const addTrack = useLibraryStore((state) => state.addTrackToPlaylist);
  const removeTrack = useLibraryStore((state) => state.removeTrackFromPlaylist);
  const reorderTracks = useLibraryStore((state) => state.reorderPlaylistTracks);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const [ordered, setOrdered] = useState<Track[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useDocumentTitle(playlist?.name ?? 'Playlist');

  useEffect(() => {
    setOrdered(playlist?.tracks ?? []);
  }, [playlist]);

  const totalDuration = ordered.reduce((total, track) => total + (track.duration ?? 0), 0);

  const handlePlay = () => {
    if (ordered.length === 0) return;
    playQueue(ordered);
  };

  const handleShuffle = () => {
    if (ordered.length === 0) return;
    if (!shuffle) toggleShuffle();
    const start = Math.floor(Math.random() * ordered.length);
    playQueue(ordered, start);
  };

  const handleReorder = async (next: Track[]) => {
    const previous = ordered;
    setOrdered(next);
    if (!playlist) return;
    const previousIds = previous.map((track) => track.id).join(',');
    const nextIds = next.map((track) => track.id).join(',');
    if (previousIds === nextIds) return;
    try {
      await reorderTracks(
        playlist.id,
        next.map((track) => track.id),
      );
      await refresh();
    } catch (err) {
      setOrdered(previous);
      toast.error('Could not reorder tracks', errorMessage(err));
    }
  };

  const handleRemove = async (track: Track) => {
    if (!playlist) return;
    const previous = ordered;
    setOrdered((tracks) => tracks.filter((item) => item.id !== track.id));
    try {
      await removeTrack(playlist.id, track.id);
      await refresh();
      toast.success('Removed from playlist', track.title);
    } catch (err) {
      setOrdered(previous);
      toast.error('Could not remove track', errorMessage(err));
    }
  };

  const handleAdd = async (trackId: string) => {
    if (!playlist) return;
    try {
      await addTrack(playlist.id, trackId);
      await refresh();
    } catch (err) {
      toast.error('Could not add track', errorMessage(err));
      throw err;
    }
  };

  if (loading) return <PageLoader />;

  if (error || !playlist) {
    return (
      <EmptyState
        icon={Disc3}
        title="Playlist not found"
        description={error ?? 'This playlist may have been deleted, or it belongs to another account.'}
        action={
          <Link
            to="/playlists"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All playlists
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-9">
      <div>
        <Link
          to="/playlists"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-bone-500 transition-colors hover:text-bone-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Playlists
        </Link>
      </div>

      <header className="grid gap-7 md:grid-cols-[220px_minmax(0,1fr)] md:items-end lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[240px] md:max-w-none">
          <PlaylistCover
            name={playlist.name}
            coverUrl={playlist.cover_url}
            previewCovers={ordered.map((track) => track.cover_url).filter((url): url is string => Boolean(url))}
            className="cover-shadow"
            rounded="rounded-[22px]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
            Playlist
          </p>
          <h1 className="mt-3 text-balance font-display text-[38px] font-medium leading-[1.02] tracking-[-0.05em] text-bone-50 sm:text-[48px]">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-bone-400">
              {playlist.description}
            </p>
          )}
          <p className="mt-4 text-[11.5px] text-bone-500">
            {ordered.length} {ordered.length === 1 ? 'track' : 'tracks'}
            {totalDuration > 0 && ` · ${formatTotalDuration(totalDuration)}`}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button onClick={handlePlay} disabled={ordered.length === 0}>
              <Play className="h-4 w-4 fill-current" />
              Play
            </Button>
            <Button
              variant="secondary"
              onClick={handleShuffle}
              disabled={ordered.length === 0}
              aria-label="Shuffle playlist"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle
            </Button>
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add tracks
            </Button>
            <Menu
              items={[
                {
                  label: 'Edit playlist',
                  icon: Pencil,
                  onSelect: () => setEditOpen(true),
                },
                {
                  label: 'Delete playlist',
                  icon: Trash2,
                  danger: true,
                  separatorBefore: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label="Playlist options"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] text-bone-400 transition-colors hover:border-white/[0.16] hover:text-bone-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            />
          </div>
        </div>
      </header>

      {ordered.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="This playlist is empty"
          description="Add tracks from your library, then drag them into the perfect order."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add tracks
            </Button>
          }
        />
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-bone-600">
            <span>Tracks</span>
            <span>Drag to reorder</span>
          </div>
          <Reorder.Group axis="y" values={ordered} onReorder={(next) => void handleReorder(next)}>
            {ordered.map((track, index) => (
              <PlaylistTrackItem
                key={track.id}
                track={track}
                index={index}
                queue={ordered}
                onRemove={handleRemove}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      <PlaylistFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        playlist={playlist}
        onUploadCover={
          user
            ? async (file, playlistId) => uploadPlaylistCover(file, user.id, playlistId)
            : undefined
        }
        onSubmit={async (input) => {
          try {
            await updatePlaylist(playlist.id, input);
            await refresh();
            toast.success('Playlist updated');
          } catch (err) {
            toast.error('Could not update playlist', errorMessage(err));
            throw err;
          }
        }}
      />

      <AddTracksModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        playlist={{ ...playlist, tracks: ordered }}
        onAdd={handleAdd}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete playlist?"
        description={`“${playlist.name}” will be deleted. The tracks themselves stay in your library.`}
        confirmLabel="Delete playlist"
        onConfirm={async () => {
          try {
            await deletePlaylist(playlist.id);
            toast.success('Playlist deleted', playlist.name);
            navigate('/playlists');
          } catch (err) {
            toast.error('Could not delete playlist', errorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
