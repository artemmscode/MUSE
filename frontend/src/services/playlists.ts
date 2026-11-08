import { supabase } from '@/lib/supabase';
import type { PlaylistSummary, PlaylistWithTracks, Track } from '@/types';

interface PlaylistQueryRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  playlist_tracks: Array<{
    position: number;
    tracks: Pick<Track, 'cover_url' | 'duration'> | null;
  }>;
}

interface PlaylistTrackQueryRow {
  position: number;
  added_at: string;
  tracks: Track | null;
}

function summarize(row: PlaylistQueryRow): PlaylistSummary {
  const ordered = [...(row.playlist_tracks ?? [])].sort((a, b) => a.position - b.position);
  const preview = ordered
    .map((item) => item.tracks?.cover_url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 4);

  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    cover_url: row.cover_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    track_count: ordered.length,
    preview_covers: preview,
    total_duration: ordered.reduce((total, item) => total + (item.tracks?.duration ?? 0), 0),
  };
}

export async function fetchPlaylists(): Promise<PlaylistSummary[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(
      'id, owner_id, name, description, cover_url, created_at, updated_at, playlist_tracks(position, tracks(cover_url, duration))',
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as PlaylistQueryRow[]).map(summarize);
}

export async function fetchPlaylist(id: string): Promise<PlaylistWithTracks> {
  const { data: playlist, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data, error: tracksError } = await supabase
    .from('playlist_tracks')
    .select('position, added_at, tracks(*)')
    .eq('playlist_id', id)
    .order('position', { ascending: true });
  if (tracksError) throw tracksError;

  const tracks = ((data ?? []) as unknown as PlaylistTrackQueryRow[])
    .filter((row): row is PlaylistTrackQueryRow & { tracks: Track } => Boolean(row.tracks))
    .map((row) => row.tracks);

  return { ...playlist, tracks };
}

export async function createPlaylist(input: {
  name: string;
  description?: string | null;
  cover_url?: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      cover_url: input.cover_url ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updatePlaylist(
  id: string,
  patch: { name?: string; description?: string | null; cover_url?: string | null },
): Promise<void> {
  const { error } = await supabase.from('playlists').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePlaylist(id: string): Promise<void> {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) throw error;
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  if (error) throw error;
  const nextPosition = (data?.[0]?.position ?? -1) + 1;

  const { error: insertError } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    position: nextPosition,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('This track is already in the playlist.');
    }
    throw insertError;
  }
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
  if (error) throw error;
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc('reorder_playlist_tracks', {
    p_playlist_id: playlistId,
    p_track_ids: trackIds,
  });
  if (error) throw error;
}
