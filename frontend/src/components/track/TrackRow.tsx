import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { TrackMenuButton } from './TrackMenuButton';
import { PlayingIndicator } from './PlayingIndicator';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { formatDuration, sourceLabel } from '@/lib/format';
import type { Track } from '@/types';

interface TrackRowProps {
  track: Track;
  queue?: Track[];
  index?: number;
  showAlbum?: boolean;
  showSource?: boolean;
  onDelete?: (track: Track) => Promise<void> | void;
  onRemoveFromPlaylist?: (track: Track) => Promise<void> | void;
  leading?: ReactNode;
  className?: string;
}

export const TrackRow = memo(function TrackRow({
  track,
  queue,
  index = 0,
  showAlbum = true,
  showSource = true,
  onDelete,
  onRemoveFromPlaylist,
  leading,
  className,
}: TrackRowProps) {
  const currentId = usePlayerStore((state) => state.queue[state.currentIndex]?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const active = currentId === track.id;
  const unavailable = track.playback_type === 'unavailable';

  const handlePlay = () => {
    if (unavailable) return;
    if (active) togglePlay();
    else playTrack(track, queue);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handlePlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePlay();
        }
      }}
      className={cn(
        'group grid grid-cols-[28px_44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-200 sm:grid-cols-[32px_44px_minmax(0,1.4fr)_minmax(0,1fr)_110px_60px_36px] sm:gap-4 sm:px-3',
        active ? 'bg-white/[0.055]' : 'hover:bg-white/[0.035]',
        unavailable && 'opacity-55',
        className,
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center">
        {leading ?? (
          <>
            <span
              className={cn(
                'text-[12px] tabular-nums transition-opacity',
                active ? 'text-accent-soft' : 'text-bone-600 group-hover:opacity-0',
              )}
            >
              {active && isPlaying ? <PlayingIndicator /> : String(index + 1).padStart(2, '0')}
            </span>
            <Play
              className={cn(
                'absolute h-3.5 w-3.5 fill-current text-bone-200 opacity-0 transition-opacity group-hover:opacity-100',
                active && 'hidden',
              )}
            />
          </>
        )}
      </div>

      <CoverArt
        src={track.cover_url}
        title={track.title}
        artist={track.artist}
        className="h-11 w-11"
        rounded="rounded-lg"
      />

      <div className="min-w-0">
        <Link
          to={`/track/${track.id}`}
          onClick={(event) => event.stopPropagation()}
          className="block"
        >
          <p
            className={cn(
              'truncate text-[13.5px] font-medium leading-snug transition-colors',
              active ? 'text-accent-soft' : 'text-bone-100 group-hover:text-white',
            )}
            title={track.title}
          >
            {track.title}
          </p>
        </Link>
        <p className="mt-0.5 truncate text-[12px] text-bone-500" title={track.artist}>
          {track.artist}
        </p>
      </div>

      {showAlbum && (
        <p className="hidden truncate text-[12.5px] text-bone-500 sm:block" title={track.album ?? ''}>
          {track.album ?? '—'}
        </p>
      )}

      {showSource ? (
        <span className="hidden text-[10px] uppercase tracking-[0.14em] text-bone-600 lg:block">
          {sourceLabel(track.source)}
        </span>
      ) : (
        <span className="hidden lg:block" />
      )}

      <span className="text-right text-[12px] tabular-nums text-bone-500">
        {formatDuration(track.duration)}
      </span>

      <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
        <TrackMenuButton
          track={track}
          queue={queue}
          onDelete={onDelete}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
          className="opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"
        />
      </div>
    </div>
  );
});
