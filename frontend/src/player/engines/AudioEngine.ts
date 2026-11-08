export interface PlaybackHandlers {
  onTime: (seconds: number) => void;
  onDuration: (seconds: number) => void;
  onEnded: () => void;
  onPlay: () => void;
  onPause: () => void;
  onError: (message: string) => void;
}

function mediaErrorMessage(error: MediaError | null): string {
  switch (error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was interrupted.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'The audio file could not be loaded. Check your connection and try again.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'This audio file could not be decoded.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'This audio format is not supported by your browser.';
    default:
      return 'The audio file could not be played.';
  }
}

/**
 * Thin wrapper around a single HTMLAudioElement.
 * The element lives for the whole session so playback survives navigation.
 */
export class AudioEngine {
  private readonly audio: HTMLAudioElement;
  private loadToken = 0;
  private loadedSrc: string | null = null;
  private destroyed = false;

  constructor(private readonly handlers: PlaybackHandlers) {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      this.handlers.onTime(this.audio.currentTime);
    });
    this.audio.addEventListener('durationchange', () => {
      if (Number.isFinite(this.audio.duration)) {
        this.handlers.onDuration(this.audio.duration);
      }
    });
    this.audio.addEventListener('ended', () => this.handlers.onEnded());
    this.audio.addEventListener('play', () => this.handlers.onPlay());
    this.audio.addEventListener('pause', () => {
      if (!this.audio.ended) this.handlers.onPause();
    });
    this.audio.addEventListener('error', () => {
      // Clearing the source (reset/destroy) makes some browsers fire
      // MEDIA_ERR_SRC_NOT_SUPPORTED. That is not a real playback failure.
      if (this.destroyed || !this.audio.getAttribute('src')) return;
      this.handlers.onError(mediaErrorMessage(this.audio.error));
    });
  }

  async load(
    src: string,
    options: { autoplay: boolean; startAt?: number },
  ): Promise<void> {
    const token = ++this.loadToken;
    this.audio.pause();

    if (this.loadedSrc !== src) {
      this.loadedSrc = src;
      this.audio.src = src;
      this.audio.load();

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('The audio took too long to load.'));
        }, 25_000);

        const onLoaded = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };
        const onError = () => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error(mediaErrorMessage(this.audio.error)));
        };
        const cleanup = () => {
          window.clearTimeout(timeout);
          this.audio.removeEventListener('loadedmetadata', onLoaded);
          this.audio.removeEventListener('error', onError);
        };

        this.audio.addEventListener('loadedmetadata', onLoaded);
        this.audio.addEventListener('error', onError);
      });
    }

    if (token !== this.loadToken) return;

    if (options.startAt && options.startAt > 0) {
      const max = Number.isFinite(this.audio.duration)
        ? Math.max(0, this.audio.duration - 0.35)
        : options.startAt;
      this.audio.currentTime = Math.min(options.startAt, max);
    }

    if (options.autoplay) {
      await this.play();
    }
  }

  async play(): Promise<void> {
    try {
      await this.audio.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.handlers.onError('Tap play to start playback.');
        return;
      }
      this.handlers.onError(mediaErrorMessage(this.audio.error));
    }
  }

  pause(): void {
    this.audio.pause();
  }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return;
    const max = Number.isFinite(this.audio.duration)
      ? Math.max(0, this.audio.duration - 0.1)
      : seconds;
    this.audio.currentTime = Math.min(Math.max(seconds, 0), max);
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(Math.max(volume, 0), 1);
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  reset(): void {
    this.loadToken += 1;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.loadedSrc = null;
  }

  destroy(): void {
    this.destroyed = true;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}
