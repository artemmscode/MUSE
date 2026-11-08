import type {
  SoundCloudProgressPayload,
  SoundCloudWidgetInstance,
} from '@/types';
import type { PlaybackHandlers } from './AudioEngine';

let apiPromise: Promise<void> | null = null;

function loadWidgetApi(): Promise<void> {
  if (window.SC?.Widget) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-muse-soundcloud-api]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('SoundCloud API failed to load.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.dataset.museSoundcloudApi = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => {
        apiPromise = null;
        reject(new Error('SoundCloud API failed to load.'));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return apiPromise;
}

function widgetSrc(trackUrl: string): string {
  const params = new URLSearchParams({
    url: trackUrl,
    color: '#cdbfa3',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    enable_api: 'true',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

/**
 * Controls the official SoundCloud Widget through its public Widget API.
 * No streams are extracted, proxied or downloaded.
 */
export class SoundCloudEngine {
  private iframe: HTMLIFrameElement | null = null;
  private widget: SoundCloudWidgetInstance | null = null;
  private ready = false;
  private currentUrl: string | null = null;

  constructor(private readonly handlers: PlaybackHandlers) {}

  private async ensureWidget(): Promise<SoundCloudWidgetInstance> {
    if (this.widget) return this.widget;

    await loadWidgetApi();

    const iframe = document.createElement('iframe');
    iframe.id = 'muse-soundcloud-widget';
    iframe.title = 'SoundCloud player';
    iframe.allow = 'autoplay';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', 'no');
    iframe.src = widgetSrc('');
    iframe.style.cssText =
      'position:fixed;width:1px;height:1px;left:-9999px;bottom:0;opacity:0;pointer-events:none;border:0;';
    document.body.appendChild(iframe);
    this.iframe = iframe;

    await new Promise<void>((resolve) => {
      if (iframe.contentWindow) {
        // The widget posts a ready message once its API is available.
        const timer = window.setTimeout(resolve, 2500);
        iframe.addEventListener(
          'load',
          () => {
            window.clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      } else {
        resolve();
      }
    });

    const SC = window.SC;
    if (!SC?.Widget) {
      throw new Error('SoundCloud Widget API is unavailable.');
    }

    const widget = new SC.Widget(iframe);
    this.widget = widget;

    widget.bind('ready', () => {
      this.ready = true;
      widget.getDuration((duration) => {
        this.handlers.onDuration(duration / 1000);
      });
    });
    widget.bind('play', () => this.handlers.onPlay());
    widget.bind('pause', () => this.handlers.onPause());
    widget.bind('finish', () => this.handlers.onEnded());
    widget.bind('playProgress', (payload) => {
      const progress = payload as SoundCloudProgressPayload;
      if (progress && Number.isFinite(progress.currentPosition)) {
        this.handlers.onTime(progress.currentPosition / 1000);
      }
    });
    widget.bind('error', () => {
      this.handlers.onError(
        'SoundCloud could not play this track in the widget. Open it on SoundCloud instead.',
      );
    });

    return widget;
  }

  async load(url: string, autoplay: boolean): Promise<void> {
    const widget = await this.ensureWidget();

    if (this.currentUrl === url && this.ready) {
      widget.getDuration((duration) => this.handlers.onDuration(duration / 1000));
      if (autoplay) widget.play();
      return;
    }

    this.currentUrl = url;
    this.ready = false;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('SoundCloud is taking too long to respond.'));
      }, 15_000);

      widget.load(url, {
        auto_play: autoplay,
        callback: () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          this.ready = true;
          widget.getDuration((duration) => this.handlers.onDuration(duration / 1000));
          resolve();
        },
      });
    });
  }

  play(): void {
    this.widget?.play();
  }

  pause(): void {
    this.widget?.pause();
  }

  seek(seconds: number): void {
    this.widget?.seekTo(Math.max(0, seconds) * 1000);
  }

  setVolume(volume: number): void {
    this.widget?.setVolume(Math.round(Math.min(Math.max(volume, 0), 1) * 100));
  }

  destroy(): void {
    try {
      this.widget?.pause();
    } catch {
      // no-op
    }
    this.iframe?.remove();
    this.iframe = null;
    this.widget = null;
    this.ready = false;
    this.currentUrl = null;
  }
}
