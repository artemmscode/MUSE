import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListMusic, Trash2, X } from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { PlayingIndicator } from '@/components/track/PlayingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/stores/playerStore';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

export function QueuePanel() {
  const open = usePlayerStore((state) => state.queueOpen);
  const close = usePlayerStore((state) => state.closeQueue);
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const jumpTo = usePlayerStore((state) => state.jumpTo);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  useScrollLock(open);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85]">
          <motion.button
            type="button"
            aria-label="Close queue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="safe-bottom absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-white/[0.08] bg-ink-900/95 backdrop-blur-2xl"
            aria-label="Playback queue"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-bone-500">
                  Up next
                </p>
                <h2 className="mt-1 font-display text-[20px] font-medium tracking-[-0.03em] text-bone-50">
                  Queue
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {queue.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearQueue} className="text-bone-400">
                    Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close queue">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              {queue.length === 0 ? (
                <EmptyState
                  icon={ListMusic}
                  title="Nothing queued"
                  description="Play a track or a playlist and it will appear here."
                  compact
                  className="mx-3 mt-6 border-0 bg-transparent"
                />
              ) : (
                <div className="space-y-0.5">
                  {queue.map((track, index) => {
                    const active = index === currentIndex;
                    return (
                      <div
                        key={`${track.id}-${index}`}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                          active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.035]',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => jumpTo(index)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="relative w-4 shrink-0 text-center text-[11px] tabular-nums text-bone-600">
                            {active && isPlaying ? (
                              <PlayingIndicator className="mx-auto h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <CoverArt
                            src={track.cover_url}
                            title={track.title}
                            artist={track.artist}
                            className="h-10 w-10 shrink-0"
                            rounded="rounded-lg"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'block truncate text-[12.5px] font-medium',
                                active ? 'text-accent-soft' : 'text-bone-100',
                              )}
                            >
                              {track.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[11.5px] text-bone-500">
                              {track.artist}
                            </span>
                          </span>
                          <span className="text-[11px] tabular-nums text-bone-600">
                            {formatDuration(track.duration)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromQueue(track.id)}
                          aria-label={`Remove ${track.title} from queue`}
                          className="rounded-full p-1.5 text-bone-600 opacity-0 transition-all hover:bg-white/[0.06] hover:text-bone-200 group-hover:opacity-100 max-sm:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {queue.length > 0 && (
              <div className="border-t border-white/[0.06] px-5 py-4">
                <div className="flex items-center justify-between text-[11px] text-bone-500">
                  <span>
                    {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
                  </span>
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-bone-200"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear queue
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
