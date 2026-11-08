import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ListPlus,
  ListX,
  MoreHorizontal,
  Play,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddToPlaylistModal } from '@/components/playlists/AddToPlaylistModal';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import type { Track } from '@/types';

interface TrackMenuButtonProps {
  track: Track;
  queue?: Track[];
  onDelete?: (track: Track) => Promise<void> | void;
  onRemoveFromPlaylist?: (track: Track) => Promise<void> | void;
  className?: string;
}

export function TrackMenuButton({
  track,
  queue,
  onDelete,
  onRemoveFromPlaylist,
  className,
}: TrackMenuButtonProps) {
  const navigate = useNavigate();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const playNext = usePlayerStore((state) => state.playNext);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Menu
        items={[
          {
            label: 'Play',
            icon: Play,
            onSelect: () => playTrack(track, queue),
            disabled: track.playback_type === 'unavailable',
          },
          {
            label: 'Play next',
            icon: PlayCircle,
            onSelect: () => playNext(track),
            disabled: track.playback_type === 'unavailable',
          },
          {
            label: 'Add to queue',
            icon: Plus,
            onSelect: () => addToQueue(track),
            disabled: track.playback_type === 'unavailable',
          },
          {
            label: 'Add to playlist',
            icon: ListPlus,
            onSelect: () => setPlaylistOpen(true),
            separatorBefore: true,
          },
          {
            label: 'Open track',
            icon: ExternalLink,
            onSelect: () => navigate(`/track/${track.id}`),
          },
          ...(onRemoveFromPlaylist
            ? [
                {
                  label: 'Remove from playlist',
                  icon: ListX,
                  onSelect: () => void onRemoveFromPlaylist(track),
                  separatorBefore: true,
                },
              ]
            : []),
          ...(onDelete
            ? [
                {
                  label: 'Delete from library',
                  icon: Trash2,
                  danger: true,
                  separatorBefore: !onRemoveFromPlaylist,
                  onSelect: () => setConfirmOpen(true),
                },
              ]
            : []),
        ]}
        trigger={(props) => (
          <button
            type="button"
            {...props}
            aria-label={`More options for ${track.title}`}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.08] hover:text-bone-100',
              className,
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      />

      <AddToPlaylistModal
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        track={track}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete track?"
        description={`“${track.title}” will be removed from your library. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          await onDelete?.(track);
        }}
      />
    </>
  );
}
