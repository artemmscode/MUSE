import type { PlaybackType, TrackSource } from '@/types';

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatTotalDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${Math.max(minutes, 1)} min`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays <= 0 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays <= 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function longDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function initials(title: string, artist?: string | null): string {
  const source = (title || artist || 'MUSE').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'M';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

const COVER_GRADIENTS = [
  'from-[#2b2b2f] via-[#1a1a1d] to-[#0d0d0f]',
  'from-[#3a3128] via-[#211c17] to-[#0d0b09]',
  'from-[#26302f] via-[#18201f] to-[#0b0f0f]',
  'from-[#312a35] via-[#1d1820] to-[#0d0b0e]',
  'from-[#2c2f3a] via-[#1a1c22] to-[#0c0d10]',
  'from-[#382b2b] via-[#211919] to-[#0e0b0b]',
];

export function coverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length]!;
}

export function sourceLabel(source: TrackSource): string {
  switch (source) {
    case 'soundcloud':
      return 'SoundCloud';
    case 'telegram_upload':
      return 'Telegram';
    case 'local':
      return 'Local';
  }
}

export function playbackLabel(playbackType: PlaybackType): string {
  switch (playbackType) {
    case 'stored_audio':
      return 'Stored audio';
    case 'soundcloud_embed':
      return 'SoundCloud';
    case 'unavailable':
      return 'Unavailable';
  }
}

export function isPlayable(playbackType: PlaybackType): boolean {
  return playbackType !== 'unavailable';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
