import type { Playlist, Track } from './database';

export type { Playlist, Track };
export type {
  Database,
  PlaybackType,
  PlaylistInsert,
  PlaylistRow,
  PlaylistTrackRow,
  PlaylistUpdate,
  Profile,
  ProfileRow,
  TrackInsert,
  TrackRow,
  TrackSource,
  TrackUpdate,
  UserSettings,
  UserSettingsRow,
} from './database';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaylistSummary extends Playlist {
  track_count: number;
  preview_covers: string[];
  total_duration: number;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}

export interface LibraryStats {
  trackCount: number;
  playlistCount: number;
  totalDuration: number;
  storedAudioCount: number;
  soundcloudCount: number;
}

export type SortField = 'created_at' | 'title' | 'artist';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type SourceFilter = 'all' | 'soundcloud' | 'upload';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    SC?: {
      Widget: new (
        iframe: HTMLIFrameElement,
      ) => SoundCloudWidgetInstance;
    };
  }
}

export interface SoundCloudWidgetInstance {
  bind: (event: string, listener: (payload?: unknown) => void) => void;
  unbind: (event: string) => void;
  load: (
    url: string,
    options?: { auto_play?: boolean; callback?: () => void },
  ) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getPosition: (callback: (position: number) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
  destroy?: () => void;
}

export interface SoundCloudProgressPayload {
  currentPosition: number;
  relativePosition: number;
}
