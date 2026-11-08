import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { Track, TrackUpdate } from '@/types';

function coverPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${env.coversBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
  } catch {
    return null;
  }
}

export async function fetchTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTrack(id: string): Promise<Track> {
  const { data, error } = await supabase.from('tracks').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function fetchRecentlyPlayed(limit = 12): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .not('last_played_at', 'is', null)
    .order('last_played_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchTracks(query: string): Promise<Track[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];
  const { data, error } = await supabase.rpc('search_tracks', { q: clean });
  if (error) throw error;
  return data ?? [];
}

export async function updateTrack(id: string, patch: TrackUpdate): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function recordTrackPlay(id: string): Promise<void> {
  const { error } = await supabase.rpc('record_track_play', { p_track_id: id });
  if (error) {
    // Playback must never be blocked by analytics.
    console.warn('Could not record play', error.message);
  }
}

export async function deleteTrack(track: Track): Promise<void> {
  const removals: Promise<unknown>[] = [];

  if (track.audio_storage_path) {
    removals.push(
      supabase.storage.from(env.audioBucket).remove([track.audio_storage_path]),
    );
  }

  const coverPath = coverPathFromUrl(track.cover_url);
  if (coverPath) {
    removals.push(supabase.storage.from(env.coversBucket).remove([coverPath]));
  }

  await Promise.allSettled(removals);

  const { error } = await supabase.from('tracks').delete().eq('id', track.id);
  if (error) throw error;
}
