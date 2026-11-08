import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { usePlayerStore, selectCurrentTrack } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { telegramHaptic } from '@/services/telegram';

interface PlayerControlsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const playSizes = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function PlayerControls({ size = 'md', className }: PlayerControlsProps) {
  const current = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);

  const unavailable = !current || current.playback_type === 'unavailable';

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      <button
        type="button"
        onClick={() => {
          telegramHaptic('selection');
          toggleShuffle();
        }}
        aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
        aria-pressed={shuffle}
        className={cn(
          'hidden h-8 w-8 items-center justify-center rounded-full transition-colors sm:flex',
          shuffle ? 'text-accent' : 'text-bone-500 hover:text-bone-200',
        )}
      >
        <Shuffle className={iconSizes[size]} />
      </button>

      <button
        type="button"
        onClick={() => {
          telegramHaptic('light');
          previous();
        }}
        disabled={unavailable}
        aria-label="Previous track"
        className="flex h-8 w-8 items-center justify-center rounded-full text-bone-300 transition-colors hover:text-bone-50 disabled:opacity-30"
      >
        <SkipBack className={cn(iconSizes[size], 'fill-current')} />
      </button>

      <button
        type="button"
        onClick={() => {
          telegramHaptic('medium');
          togglePlay();
        }}
        disabled={unavailable}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={cn(
          'flex items-center justify-center rounded-full bg-bone-100 text-ink-950 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-30 disabled:hover:scale-100',
          playSizes[size],
        )}
      >
        {isPlaying ? (
          <Pause className={cn(iconSizes[size], 'fill-current')} />
        ) : (
          <Play className={cn(iconSizes[size], 'ml-0.5 fill-current')} />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          telegramHaptic('light');
          next();
        }}
        disabled={unavailable}
        aria-label="Next track"
        className="flex h-8 w-8 items-center justify-center rounded-full text-bone-300 transition-colors hover:text-bone-50 disabled:opacity-30"
      >
        <SkipForward className={cn(iconSizes[size], 'fill-current')} />
      </button>

      <button
        type="button"
        onClick={() => {
          telegramHaptic('selection');
          cycleRepeat();
        }}
        aria-label={`Repeat: ${repeat}`}
        className={cn(
          'relative hidden h-8 w-8 items-center justify-center rounded-full transition-colors sm:flex',
          repeat !== 'off' ? 'text-accent' : 'text-bone-500 hover:text-bone-200',
        )}
      >
        {repeat === 'one' ? (
          <Repeat1 className={iconSizes[size]} />
        ) : (
          <Repeat className={iconSizes[size]} />
        )}
      </button>
    </div>
  );
}
