import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, ListMusic, X } from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from './ProgressBar';
import { PlayerControls } from './PlayerControls';
import { VolumeControl } from './VolumeControl';
import { PlayingIndicator } from '@/components/track/PlayingIndicator';
import { usePlayerStore, selectCurrentTrack } from '@/stores/playerStore';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatDuration, sourceLabel } from '@/lib/format';

export function NowPlayingSheet() {
  const open = usePlayerStore((state) => state.nowPlayingOpen);
  const close = usePlayerStore((state) => state.closeNowPlaying);
  const openQueue = usePlayerStore((state) => state.openQueue);
  const track = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const requestSeek = usePlayerStore((state) => state.requestSeek);

  useScrollLock(open);

  if (typeof document === 'undefined') return null;

  const unavailable = track?.playback_type === 'unavailable';

  return createPortal(
    <AnimatePresence>
      {open && track && (
        <div className="fixed inset-0 z-[88] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close now playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.99 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="safe-bottom relative z-10 flex max-h-[96dvh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-[32px] border border-white/[0.08] bg-ink-900/90 shadow-[0_60px_180px_-40px_rgba(0,0,0,1)] backdrop-blur-3xl sm:max-h-[92dvh] sm:rounded-[32px]"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              {track.cover_url && (
                <img
                  src={track.cover_url}
                  alt=""
                  className="h-full w-full scale-125 object-cover opacity-[0.16] blur-[80px]"
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/80 to-ink-950/95" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-8 sm:pt-7">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
                  Now playing
                </span>
                {isPlaying && <PlayingIndicator className="h-2.5 w-2.5" />}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-bone-400 transition-colors hover:bg-white/[0.07] hover:text-bone-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-7 overflow-y-auto px-5 pb-8 pt-4 sm:px-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] md:items-center md:gap-12 md:pb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-[340px] md:max-w-none"
              >
                <CoverArt
                  src={track.cover_url}
                  title={track.title}
                  artist={track.artist}
                  className="aspect-square w-full cover-shadow"
                  rounded="rounded-[24px]"
                  priority
                />
              </motion.div>

              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{sourceLabel(track.source)}</Badge>
                  {track.album && <Badge tone="muted">{track.album}</Badge>}
                </div>
                <h2 className="mt-4 text-balance font-display text-[30px] font-medium leading-[1.05] tracking-[-0.045em] text-bone-50 sm:text-[40px]">
                  {track.title}
                </h2>
                <p className="mt-2.5 text-[15px] text-bone-300">{track.artist}</p>

                {unavailable ? (
                  <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[12.5px] leading-relaxed text-bone-400">
                    This track is saved for reference, but no playable audio is available.
                    {track.source_url && (
                      <a
                        href={track.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1.5 text-accent-soft hover:underline"
                      >
                        Open source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mt-8">
                      <ProgressBar
                        value={progress}
                        max={duration || track.duration || 0}
                        onSeek={requestSeek}
                      />
                      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-bone-500">
                        <span>{formatDuration(progress)}</span>
                        <span>{formatDuration(duration || track.duration)}</span>
                      </div>
                    </div>

                    <PlayerControls size="lg" className="mt-7 justify-start" />

                    <div className="mt-7 flex items-center justify-between gap-4">
                      <VolumeControl />
                      <button
                        type="button"
                        onClick={openQueue}
                        className="flex items-center gap-2 rounded-full border border-white/[0.08] px-3.5 py-2 text-[11.5px] font-medium text-bone-300 transition-colors hover:border-white/[0.16] hover:text-bone-50"
                      >
                        <ListMusic className="h-3.5 w-3.5" />
                        Queue
                      </button>
                    </div>

                    {track.playback_type === 'soundcloud_embed' && (
                      <p className="mt-6 text-[11px] leading-relaxed text-bone-500">
                        Streaming through the official SoundCloud Widget API. No audio is copied
                        or extracted by MUSE.
                      </p>
                    )}
                  </>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={close}
                    className="px-0 text-bone-400 hover:bg-transparent"
                  >
                    Back to library
                  </Button>
                  {track.source_url && (
                    <a
                      href={track.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-bone-500 transition-colors hover:text-bone-200"
                    >
                      {track.source === 'soundcloud' ? 'Listen on SoundCloud' : 'Open source'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
