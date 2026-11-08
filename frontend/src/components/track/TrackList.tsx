import { TrackRow } from './TrackRow';
import { TrackRowSkeleton } from '@/components/ui/Skeleton';
import type { Track } from '@/types';

interface TrackListProps {
  tracks: Track[];
  queue?: Track[];
  loading?: boolean;
  showAlbum?: boolean;
  showSource?: boolean;
  onDelete?: (track: Track) => Promise<void> | void;
  onRemoveFromPlaylist?: (track: Track) => Promise<void> | void;
  emptyState?: React.ReactNode;
}

export function TrackList({
  tracks,
  queue,
  loading = false,
  showAlbum = true,
  showSource = true,
  onDelete,
  onRemoveFromPlaylist,
  emptyState,
}: TrackListProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <TrackRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (tracks.length === 0) return <>{emptyState}</>;

  return (
    <div>
      <div className="mb-1 hidden grid-cols-[32px_44px_minmax(0,1.4fr)_minmax(0,1fr)_110px_60px_36px] items-center gap-4 border-b border-white/[0.06] px-3 pb-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-bone-600 sm:grid">
        <span className="text-center">#</span>
        <span />
        <span>Title</span>
        {showAlbum && <span>Album</span>}
        {showSource && <span>Source</span>}
        <span className="text-right">Time</span>
        <span />
      </div>
      <div className="space-y-0.5">
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            queue={queue ?? tracks}
            index={index}
            showAlbum={showAlbum}
            showSource={showSource}
            onDelete={onDelete}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
          />
        ))}
      </div>
    </div>
  );
}
