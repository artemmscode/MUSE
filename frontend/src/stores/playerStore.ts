import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RepeatMode, Track } from '@/types';
import { clamp } from '@/lib/utils';

export interface SeekRequest {
  seconds: number;
  nonce: number;
}

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  autoplay: boolean;
  queueOpen: boolean;
  nowPlayingOpen: boolean;
  seekRequest: SeekRequest | null;
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  requestSeek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setAutoplay: (autoplay: boolean) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  applyDefaultVolume: (volume: number) => void;
}

function isPlayable(track: Track): boolean {
  return track.playback_type !== 'unavailable';
}

function findPlayableIndex(
  queue: Track[],
  start: number,
  direction: 1 | -1,
  wrap: boolean,
): number {
  if (queue.length === 0) return -1;
  let index = start;
  for (let step = 0; step < queue.length; step += 1) {
    index += direction;
    if (index < 0 || index >= queue.length) {
      if (!wrap) return -1;
      index = direction === 1 ? 0 : queue.length - 1;
    }
    if (isPlayable(queue[index]!)) return index;
  }
  return -1;
}

function randomPlayableIndex(queue: Track[], current: number): number {
  const candidates = queue
    .map((track, index) => ({ track, index }))
    .filter(({ track, index }) => index !== current && isPlayable(track));
  if (candidates.length === 0) return current;
  return candidates[Math.floor(Math.random() * candidates.length)]!.index;
}

const seek = (seconds: number): SeekRequest => ({ seconds, nonce: Date.now() });

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      shuffle: false,
      repeat: 'off',
      autoplay: true,
      queueOpen: false,
      nowPlayingOpen: false,
      seekRequest: null,

      playTrack: (track, contextQueue) => {
        const state = get();
        const nextQueue =
          contextQueue && contextQueue.length > 0 ? contextQueue : state.queue;
        let index = nextQueue.findIndex((item) => item.id === track.id);
        const queue = [...nextQueue];
        if (index === -1) {
          queue.push(track);
          index = queue.length - 1;
        }
        const isSame = state.queue[state.currentIndex]?.id === track.id;
        set({
          queue,
          currentIndex: index,
          isPlaying: isPlayable(track),
          progress: isSame ? state.progress : 0,
          duration: track.duration ?? 0,
          seekRequest: isSame ? state.seekRequest : seek(0),
        });
      },

      playQueue: (tracks, startIndex = 0) => {
        if (tracks.length === 0) return;
        const safeIndex = clamp(startIndex, 0, tracks.length - 1);
        const track = tracks[safeIndex]!;
        set({
          queue: [...tracks],
          currentIndex: safeIndex,
          isPlaying: isPlayable(track),
          progress: 0,
          duration: track.duration ?? 0,
          seekRequest: seek(0),
        });
      },

      togglePlay: () => {
        const state = get();
        const track = state.queue[state.currentIndex];
        if (!track || !isPlayable(track)) return;
        if (!state.isPlaying && state.duration > 0 && state.progress >= state.duration - 0.25) {
          set({ progress: 0, seekRequest: seek(0), isPlaying: true });
          return;
        }
        set({ isPlaying: !state.isPlaying });
      },

      setPlaying: (isPlaying) => set({ isPlaying }),

      next: () => {
        const state = get();
        if (state.queue.length === 0) return;
        const index = state.shuffle
          ? randomPlayableIndex(state.queue, state.currentIndex)
          : findPlayableIndex(
              state.queue,
              state.currentIndex,
              1,
              state.repeat === 'all' || state.queue.length > 1,
            );
        if (index === -1) {
          set({ isPlaying: false, progress: state.duration });
          return;
        }
        const track = state.queue[index]!;
        set({
          currentIndex: index,
          progress: 0,
          duration: track.duration ?? 0,
          isPlaying: isPlayable(track),
          seekRequest: seek(0),
        });
      },

      previous: () => {
        const state = get();
        if (state.queue.length === 0) return;
        if (state.progress > 3) {
          set({ progress: 0, seekRequest: seek(0) });
          return;
        }
        const index = state.shuffle
          ? randomPlayableIndex(state.queue, state.currentIndex)
          : findPlayableIndex(state.queue, state.currentIndex, -1, true);
        if (index === -1) return;
        const track = state.queue[index]!;
        set({
          currentIndex: index,
          progress: 0,
          duration: track.duration ?? 0,
          isPlaying: isPlayable(track),
          seekRequest: seek(0),
        });
      },

      jumpTo: (index) => {
        const state = get();
        const track = state.queue[index];
        if (!track) return;
        set({
          currentIndex: index,
          progress: 0,
          duration: track.duration ?? 0,
          isPlaying: isPlayable(track),
          seekRequest: seek(0),
        });
      },

      setProgress: (seconds) => {
        const duration = get().duration;
        set({ progress: clamp(seconds, 0, duration > 0 ? duration : seconds) });
      },

      setDuration: (seconds) => {
        if (Number.isFinite(seconds) && seconds > 0) set({ duration: seconds });
      },

      requestSeek: (seconds) => {
        const duration = get().duration;
        const target = clamp(seconds, 0, duration > 0 ? duration : seconds);
        set({ progress: target, seekRequest: seek(target) });
      },

      seekBy: (delta) => {
        const state = get();
        get().requestSeek(state.progress + delta);
      },

      setVolume: (volume) => {
        const nextVolume = clamp(volume, 0, 1);
        set({ volume: nextVolume, muted: nextVolume === 0 ? true : false });
      },

      toggleMute: () => set((state) => ({ muted: !state.muted })),

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
        })),

      setAutoplay: (autoplay) => set({ autoplay }),

      playNext: (track) => {
        const state = get();
        const queue = state.queue.filter((item) => item.id !== track.id);
        const insertAt = Math.min(state.currentIndex + 1, queue.length);
        queue.splice(insertAt, 0, track);
        set({ queue });
      },

      addToQueue: (track) => {
        const state = get();
        if (state.queue.some((item) => item.id === track.id)) return;
        set({ queue: [...state.queue, track] });
      },

      removeFromQueue: (trackId) => {
        const state = get();
        const index = state.queue.findIndex((track) => track.id === trackId);
        if (index === -1) return;
        const queue = state.queue.filter((track) => track.id !== trackId);
        if (queue.length === 0) {
          set({
            queue: [],
            currentIndex: 0,
            isPlaying: false,
            progress: 0,
            duration: 0,
          });
          return;
        }
        let currentIndex = state.currentIndex;
        if (index < currentIndex) currentIndex -= 1;
        if (index === currentIndex && index >= queue.length) currentIndex = queue.length - 1;
        const current = queue[currentIndex];
        set({
          queue,
          currentIndex,
          duration: current?.duration ?? 0,
          isPlaying: index === state.currentIndex ? false : state.isPlaying,
        });
      },

      clearQueue: () =>
        set({
          queue: [],
          currentIndex: 0,
          isPlaying: false,
          progress: 0,
          duration: 0,
          seekRequest: null,
        }),

      openQueue: () => set({ queueOpen: true }),
      closeQueue: () => set({ queueOpen: false }),
      openNowPlaying: () => set({ nowPlayingOpen: true }),
      closeNowPlaying: () => set({ nowPlayingOpen: false }),

      applyDefaultVolume: (volume) => {
        if (get().volume === 0.8) set({ volume: clamp(volume, 0, 1) });
      },
    }),
    {
      name: 'muse-player-v1',
      version: 1,
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        autoplay: state.autoplay,
        progress: state.progress,
      }),
    },
  ),
);

export const selectCurrentTrack = (state: PlayerState): Track | null =>
  state.queue[state.currentIndex] ?? null;
