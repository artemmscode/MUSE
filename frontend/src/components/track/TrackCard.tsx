import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CoverArt } from '@/components/ui/CoverArt';
import { PlayButton } from '@/components/ui/PlayButton';
import { TrackMenuButton } from './TrackMenuButton';
import { PlayingIndicator } from './PlayingIndicator';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import type { Track } from '@/types';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  onDelete?: (track: Track) => Promise<void> | void;
  index?: number;
  className?: string;
}

export const TrackCard = memo(function TrackCard({
  track,
  queue,
  onDelete,
  index = 0,
  className,
}: TrackCardProps) {
  const currentId = usePlayerStore((state) => state.queue[state.currentIndex]?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const active = currentId === track.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.035, 0.35),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn('group relative min-w-0', className)}
    >
      <Link
        to={`/track/${track.id}`}
        className="block rounded-2xl focus-visible:outline-offset-4"
        aria-label={`${track.title} by ${track.artist}`}
      >
        <div className="relative overflow-hidden rounded-2xl">
          <CoverArt
            src={track.cover_url}
            title={track.title}
            artist={track.artist}
            className="aspect-square w-full cover-shadow transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
            rounded="rounded-2xl"
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
            <span className="translate-y-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium tracking-wide text-bone-200 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {formatDuration(track.duration)}
            </span>
            <PlayButton
              track={track}
              queue={queue}
              size="md"
              className="max-md:opacity-100 max-md:translate-y-0"
            />
          </div>
          {active && (
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-md">
              {isPlaying ? (
                <PlayingIndicator className="h-3 w-3" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/track/${track.id}`} className="block">
            <h3
              className={cn(
                'truncate text-[13.5px] font-medium leading-snug tracking-[-0.01em] transition-colors',
                active ? 'text-accent-soft' : 'text-bone-100 group-hover:text-white',
              )}
              title={track.title}
            >
              {track.title}
            </h3>
          </Link>
          <p className="mt-1 truncate text-[12px] text-bone-500" title={track.artist}>
            {track.artist}
          </p>
        </div>
        <div className="-mr-1.5 -mt-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:opacity-100">
          <TrackMenuButton track={track} queue={queue} onDelete={onDelete} />
        </div>
      </div>
    </motion.article>
  );
});
