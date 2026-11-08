import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { telegramHaptic } from '@/services/telegram';
import type { Track } from '@/types';

interface PlayButtonProps {
  track: Track;
  queue?: Track[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alwaysVisible?: boolean;
}

const sizes = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function PlayButton({
  track,
  queue,
  size = 'md',
  className,
  alwaysVisible = false,
}: PlayButtonProps) {
  const current = usePlayerStore((state) => state.queue[state.currentIndex] ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const isCurrent = current?.id === track.id;
  const active = isCurrent && isPlaying;
  const disabled = track.playback_type === 'unavailable';

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={
        disabled ? 'This track cannot be played' : active ? `Pause ${track.title}` : `Play ${track.title}`
      }
      title={disabled ? 'Playback unavailable' : active ? 'Pause' : 'Play'}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        telegramHaptic('light');
        if (isCurrent) togglePlay();
        else playTrack(track, queue);
      }}
      className={cn(
        'group/play relative flex shrink-0 items-center justify-center rounded-full bg-bone-100 text-ink-950 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-bone-500',
        sizes[size],
        !alwaysVisible && 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0',
        className,
      )}
    >
      {active ? (
        <Pause className={cn(iconSizes[size], 'fill-current')} />
      ) : (
        <Play className={cn(iconSizes[size], 'ml-0.5 fill-current')} />
      )}
    </button>
  );
}
