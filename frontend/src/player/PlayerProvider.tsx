import { useEffect, useRef, type ReactNode } from 'react';
import { getSignedAudioUrl } from '@/services/storage';
import { toast } from '@/stores/toastStore';
import { selectCurrentTrack, usePlayerStore } from '@/stores/playerStore';
import { AudioEngine } from './engines/AudioEngine';
import { SoundCloudEngine } from './engines/SoundCloudEngine';

type ActiveEngine = 'audio' | 'soundcloud' | null;

/**
 * Owns the two playback engines and keeps them in sync with the player store.
 * Mounted once at the application shell level, so music survives navigation.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<AudioEngine | null>(null);
  const soundCloudRef = useRef<SoundCloudEngine | null>(null);
  const activeEngineRef = useRef<ActiveEngine>(null);
  const readyRef = useRef(false);
  const generationRef = useRef(0);
  const lastErrorRef = useRef<{ message: string; at: number } | null>(null);

  const currentTrack = usePlayerStore(selectCurrentTrack);
  const trackId = currentTrack?.id ?? null;
  const playbackType = currentTrack?.playback_type ?? null;
  const audioPath = currentTrack?.audio_storage_path ?? null;
  const sourceUrl = currentTrack?.source_url ?? null;
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const seekNonce = usePlayerStore((state) => state.seekRequest?.nonce ?? 0);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);

  useEffect(() => {
    const handleError = (message: string) => {
      const now = Date.now();
      if (
        lastErrorRef.current &&
        lastErrorRef.current.message === message &&
        now - lastErrorRef.current.at < 2500
      ) {
        return;
      }
      lastErrorRef.current = { message, at: now };
      usePlayerStore.getState().setPlaying(false);
      if (message.toLowerCase().includes('tap play')) {
        toast.info('Playback paused', message);
      } else {
        toast.error('Playback error', message);
      }
    };

    const audio = new AudioEngine({
      onTime: (seconds) => usePlayerStore.getState().setProgress(seconds),
      onDuration: (seconds) => usePlayerStore.getState().setDuration(seconds),
      onEnded: () => {
        const state = usePlayerStore.getState();
        if (state.repeat === 'one') {
          const track = state.queue[state.currentIndex];
          state.requestSeek(0);
          if (track?.playback_type === 'stored_audio') {
            audioRef.current?.seek(0);
            void audioRef.current?.play();
          } else {
            soundCloudRef.current?.seek(0);
            soundCloudRef.current?.play();
          }
          return;
        }
        if (state.autoplay) {
          state.next();
        } else {
          state.setPlaying(false);
        }
      },
      onPlay: () => usePlayerStore.getState().setPlaying(true),
      onPause: () => usePlayerStore.getState().setPlaying(false),
      onError: handleError,
    });

    const soundCloud = new SoundCloudEngine({
      onTime: (seconds) => usePlayerStore.getState().setProgress(seconds),
      onDuration: (seconds) => usePlayerStore.getState().setDuration(seconds),
      onEnded: () => {
        const state = usePlayerStore.getState();
        if (state.repeat === 'one') {
          soundCloudRef.current?.seek(0);
          soundCloudRef.current?.play();
          return;
        }
        if (state.autoplay) state.next();
        else state.setPlaying(false);
      },
      onPlay: () => usePlayerStore.getState().setPlaying(true),
      onPause: () => usePlayerStore.getState().setPlaying(false),
      onError: handleError,
    });

    audioRef.current = audio;
    soundCloudRef.current = soundCloud;

    return () => {
      audio.destroy();
      soundCloud.destroy();
      audioRef.current = null;
      soundCloudRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setVolume(volume);
    audioRef.current?.setMuted(muted);
    soundCloudRef.current?.setVolume(muted ? 0 : volume);
  }, [muted, volume]);

  useEffect(() => {
    const generation = ++generationRef.current;
    readyRef.current = false;

    const audio = audioRef.current;
    const soundCloud = soundCloudRef.current;
    if (!audio || !soundCloud) return;

    if (!trackId || !playbackType) {
      audio.pause();
      soundCloud.pause();
      activeEngineRef.current = null;
      return;
    }

    if (playbackType === 'unavailable') {
      audio.pause();
      soundCloud.pause();
      activeEngineRef.current = null;
      usePlayerStore.getState().setPlaying(false);
      return;
    }

    if (playbackType === 'soundcloud_embed') {
      audio.pause();
      if (!sourceUrl) {
        usePlayerStore.getState().setPlaying(false);
        toast.error('Playback unavailable', 'This track has no SoundCloud link.');
        return;
      }
      activeEngineRef.current = 'soundcloud';
      const state = usePlayerStore.getState();
      const autoplay = state.isPlaying;
      const startAt = state.progress;

      soundCloud
        .load(sourceUrl, autoplay)
        .then(() => {
          if (generation !== generationRef.current) return;
          readyRef.current = true;
          if (startAt > 0) soundCloud.seek(startAt);
          if (!usePlayerStore.getState().isPlaying) soundCloud.pause();
        })
        .catch((error: unknown) => {
          if (generation !== generationRef.current) return;
          usePlayerStore.getState().setPlaying(false);
          toast.error(
            'SoundCloud playback failed',
            error instanceof Error
              ? error.message
              : 'Open the track on SoundCloud to listen.',
          );
        });
      return;
    }

    soundCloud.pause();
    activeEngineRef.current = 'audio';

    if (!audioPath) {
      usePlayerStore.getState().setPlaying(false);
      toast.error('Playback unavailable', 'The audio file is missing from storage.');
      return;
    }

    const state = usePlayerStore.getState();
    const autoplay = state.isPlaying;
    const startAt = state.progress;

    getSignedAudioUrl(audioPath)
      .then((url) => {
        if (generation !== generationRef.current) return;
        return audio.load(url, { autoplay, startAt });
      })
      .then(() => {
        if (generation !== generationRef.current) return;
        readyRef.current = true;
        if (!usePlayerStore.getState().isPlaying) audio.pause();
      })
      .catch((error: unknown) => {
        if (generation !== generationRef.current) return;
        usePlayerStore.getState().setPlaying(false);
        toast.error(
          'Could not play this track',
          error instanceof Error ? error.message : 'The audio file is unavailable.',
        );
      });
  }, [audioPath, playbackType, sourceUrl, trackId]);

  useEffect(() => {
    if (!readyRef.current) return;
    if (!trackId) return;
    if (playbackType === 'unavailable') return;

    if (isPlaying) {
      if (activeEngineRef.current === 'audio') void audioRef.current?.play();
      else if (activeEngineRef.current === 'soundcloud') soundCloudRef.current?.play();
    } else {
      audioRef.current?.pause();
      soundCloudRef.current?.pause();
    }
  }, [isPlaying, playbackType, trackId]);

  useEffect(() => {
    if (!seekNonce || !readyRef.current) return;
    const target = usePlayerStore.getState().seekRequest?.seconds ?? 0;
    if (activeEngineRef.current === 'audio') audioRef.current?.seek(target);
    else if (activeEngineRef.current === 'soundcloud') soundCloudRef.current?.seek(target);
  }, [seekNonce]);

  return <>{children}</>;
}
