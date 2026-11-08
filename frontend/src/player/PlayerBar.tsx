import { ChevronUp, ListMusic, Maximize2 } from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { ProgressBar } from './ProgressBar';
import { PlayerControls } from './PlayerControls';
import { VolumeControl } from './VolumeControl';
import { PlayingIndicator } from '@/components/track/PlayingIndicator';
import { selectCurrentTrack, usePlayerStore } from '@/stores/playerStore';
import { formatDuration, sourceLabel } from '@/lib/format';

export function PlayerBar() {
  const track = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const requestSeek = usePlayerStore((state) => state.requestSeek);
  const openQueue = usePlayerStore((state) => state.openQueue);
  const openNowPlaying = usePlayerStore((state) => state.openNowPlaying);
  const queueLength = usePlayerStore((state) => state.queue.length);

  if (!track) return null;

  const unavailable = track.playback_type === 'unavailable';

  return (
    <>
      {/* Desktop player */}
      <footer className="fixed inset-x-0 bottom-0 z-50 hidden border-t border-white/[0.07] bg-ink-900/80 backdrop-blur-2xl md:block">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />
        <div className="mx-auto grid h-[88px] max-w-[1700px] grid-cols-[minmax(0,1fr)_minmax(420px,1.45fr)_minmax(0,1fr)] items-center gap-6 px-6">
          <button
            type="button"
            onClick={openNowPlaying}
            className="group flex min-w-0 items-center gap-3.5 text-left"
            aria-label="Open now playing"
          >
            <div className="relative shrink-0">
              <CoverArt
                src={track.cover_url}
                title={track.title}
                artist={track.artist}
                className="h-[54px] w-[54px]"
                rounded="rounded-xl"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                <ChevronUp className="h-4 w-4 text-white" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-medium text-bone-50" title={track.title}>
                  {track.title}
                </p>
                {isPlaying && <PlayingIndicator className="h-2.5 w-2.5 shrink-0" />}
              </div>
              <p className="mt-0.5 truncate text-[11.5px] text-bone-500" title={track.artist}>
                {track.artist}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-bone-600">
                {unavailable ? 'Unavailable' : sourceLabel(track.source)}
              </p>
            </div>
          </button>

          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <PlayerControls size="md" />
            <div className="flex w-full items-center gap-2.5">
              <span className="w-9 text-right text-[10px] tabular-nums text-bone-500">
                {formatDuration(progress)}
              </span>
              <ProgressBar
                value={progress}
                max={duration || track.duration || 0}
                onSeek={requestSeek}
                disabled={unavailable}
                className="flex-1"
              />
              <span className="w-9 text-[10px] tabular-nums text-bone-500">
                {formatDuration(duration || track.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1">
            <VolumeControl className="mr-1" />
            <button
              type="button"
              onClick={openQueue}
              aria-label={`Open queue (${queueLength} tracks)`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.06] hover:text-bone-100"
            >
              <ListMusic className="h-[17px] w-[17px]" />
              {queueLength > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-ink-950">
                  {queueLength > 99 ? '99' : queueLength}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={openNowPlaying}
              aria-label="Expand player"
              className="flex h-9 w-9 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.06] hover:text-bone-100"
            >
              <Maximize2 className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile compact player */}
      <div
        className="fixed inset-x-0 z-50 border-t border-white/[0.08] bg-ink-900/90 backdrop-blur-2xl md:hidden"
        style={{
          bottom:
            'calc(var(--mobile-nav-height) + var(--safe-bottom) + var(--tg-safe-bottom))',
        }}
      >
        <ProgressBar
          value={progress}
          max={duration || track.duration || 0}
          onSeek={requestSeek}
          disabled={unavailable}
          className="absolute inset-x-0 -top-[2px] h-[2px] rounded-none"
        />
        <div className="flex h-[68px] items-center gap-3 px-3">
          <button
            type="button"
            onClick={openNowPlaying}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label="Open now playing"
          >
            <CoverArt
              src={track.cover_url}
              title={track.title}
              artist={track.artist}
              className="h-11 w-11 shrink-0"
              rounded="rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-bone-50">{track.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-bone-500">{track.artist}</p>
            </div>
          </button>
          <PlayerControls size="sm" className="shrink-0 gap-1" />
          <button
            type="button"
            onClick={openQueue}
            aria-label="Open queue"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-bone-400"
          >
            <ListMusic className="h-[18px] w-[18px]" />
            {queueLength > 0 && (
              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

