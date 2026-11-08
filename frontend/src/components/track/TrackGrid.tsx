import { TrackCard } from './TrackCard';
import type { Track } from '@/types';

interface TrackGridProps {
  tracks: Track[];
  queue?: Track[];
  onDelete?: (track: Track) => Promise<void> | void;
  className?: string;
}

export function TrackGrid({ tracks, queue, onDelete, className }: TrackGridProps) {
  return (
    <div
      className={
        className ??
        'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
      }
    >
      {tracks.map((track, index) => (
        <TrackCard
          key={track.id}
          track={track}
          queue={queue ?? tracks}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  );
}
