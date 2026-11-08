import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

interface CachedUrl {
  url: string;
  expiresAt: number;
}

const audioUrlCache = new Map<string, CachedUrl>();

export async function getSignedAudioUrl(path: string, forceRefresh = false): Promise<string> {
  const cached = audioUrlCache.get(path);
  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(env.audioBucket)
    .createSignedUrl(path, env.signedUrlTtlSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      error?.message ??
        'Could not create a playback link. The audio file may be missing from storage.',
    );
  }

  audioUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + env.signedUrlTtlSeconds * 1000,
  });

  return data.signedUrl;
}

export function invalidateSignedAudioUrl(path: string): void {
  audioUrlCache.delete(path);
}

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadPlaylistCover(
  file: File,
  userId: string,
  playlistId: string,
): Promise<string> {
  if (!COVER_TYPES.has(file.type)) {
    throw new Error('Use a JPEG, PNG, WebP or GIF image.');
  }
  if (file.size > MAX_COVER_BYTES) {
    throw new Error('Cover image must be smaller than 5 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/playlists/${playlistId}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(env.coversBucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from(env.coversBucket).getPublicUrl(path).data.publicUrl;
}
