import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);

  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const displayVolume = muted ? 0 : volume;

  return (
    <div className={cn('group flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="flex h-8 w-8 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.06] hover:text-bone-100"
      >
        <Icon className="h-[17px] w-[17px]" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={displayVolume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label="Volume"
        className="range w-[86px] opacity-80 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(to right, rgba(242,240,234,0.75) ${displayVolume * 100}%, rgba(255,255,255,0.14) ${displayVolume * 100}%)`,
        }}
      />
    </div>
  );
}
