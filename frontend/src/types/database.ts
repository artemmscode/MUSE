export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TrackSource = 'soundcloud' | 'local' | 'telegram_upload';
export type PlaybackType = 'stored_audio' | 'soundcloud_embed' | 'unavailable';

export type TrackRow = {
  id: string;
  owner_id: string;
  title: string;
  artist: string;
  album: string | null;
  cover_url: string | null;
  duration: number | null;
  source: TrackSource;
  source_url: string | null;
  source_track_id: string | null;
  audio_storage_path: string | null;
  playback_type: PlaybackType;
  is_downloadable: boolean;
  genre: string | null;
  year: number | null;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
  play_count: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TrackInsert = {
  id?: string;
  owner_id?: string;
  title: string;
  artist?: string;
  album?: string | null;
  cover_url?: string | null;
  duration?: number | null;
  source: TrackSource;
  source_url?: string | null;
  source_track_id?: string | null;
  audio_storage_path?: string | null;
  playback_type: PlaybackType;
  is_downloadable?: boolean;
  genre?: string | null;
  year?: number | null;
  file_size?: number | null;
  mime_type?: string | null;
  checksum?: string | null;
  play_count?: number;
  last_played_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TrackUpdate = Partial<TrackInsert>;

export type PlaylistRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PlaylistInsert = {
  id?: string;
  owner_id?: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PlaylistUpdate = Partial<PlaylistInsert>;

export type PlaylistTrackRow = {
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export type UserSettingsRow = {
  owner_id: string;
  display_name: string | null;
  telegram_user_id: number | null;
  default_volume: number;
  autoplay: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  telegram_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: TrackRow;
        Insert: TrackInsert;
        Update: TrackUpdate;
        Relationships: [];
      };
      playlists: {
        Row: PlaylistRow;
        Insert: PlaylistInsert;
        Update: PlaylistUpdate;
        Relationships: [];
      };
      playlist_tracks: {
        Row: PlaylistTrackRow;
        Insert: {
          playlist_id: string;
          track_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          playlist_id?: string;
          track_id?: string;
          position?: number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlist_tracks_playlist_id_fkey';
            columns: ['playlist_id'];
            isOneToOne: false;
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_tracks_track_id_fkey';
            columns: ['track_id'];
            isOneToOne: false;
            referencedRelation: 'tracks';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: {
          owner_id?: string;
          display_name?: string | null;
          telegram_user_id?: number | null;
          default_volume?: number;
          autoplay?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          display_name?: string | null;
          telegram_user_id?: number | null;
          default_volume?: number;
          autoplay?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          telegram_user_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          telegram_user_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_track_play: {
        Args: { p_track_id: string };
        Returns: undefined;
      };
      reorder_playlist_tracks: {
        Args: { p_playlist_id: string; p_track_ids: string[] };
        Returns: undefined;
      };
      search_tracks: {
        Args: { q: string };
        Returns: TrackRow[];
      };
    };
    Enums: {
      track_source: TrackSource;
      playback_type: PlaybackType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Track = TrackRow;
export type Playlist = PlaylistRow;
export type UserSettings = UserSettingsRow;
export type Profile = ProfileRow;
