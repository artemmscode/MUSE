function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

function siteUrl(): string {
  const configured = clean(import.meta.env.VITE_SITE_URL).replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, '');
}

export const env = {
  supabaseUrl: clean(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  telegramBotUsername: clean(import.meta.env.VITE_TELEGRAM_BOT_USERNAME) || 'muse_music_bot',
  siteUrl: siteUrl(),
  audioBucket: 'audio',
  coversBucket: 'covers',
  signedUrlTtlSeconds: 60 * 60,
  syncIntervalMs: 60_000,
} as const;

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseUrl.startsWith('http'),
);

export const telegramBotUrl = `https://t.me/${env.telegramBotUsername.replace(/^@/, '')}`;

export function trackUrl(trackId: string): string {
  return `${env.siteUrl}/track/${trackId}`;
}
