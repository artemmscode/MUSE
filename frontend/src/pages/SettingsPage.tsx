import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Cloud,
  Database,
  ExternalLink,
  LogOut,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Volume2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/toastStore';
import { supabase } from '@/lib/supabase';
import { ensureSettings, updateProfileDisplayName, updateSettings } from '@/services/settings';
import { telegramBotUrl } from '@/lib/env';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatTotalDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/types';

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: typeof UserRound;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[22px] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div>
          <h2 className="font-display text-[16px] font-medium tracking-[-0.02em] text-bone-100">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[11.5px] leading-relaxed text-bone-500">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-accent' : 'bg-white/[0.12]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-ink-950 shadow transition-transform duration-300',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  useDocumentTitle('Settings');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMiniApp, platform, user: telegramUser } = useTelegram();
  const tracks = useLibraryStore((state) => state.tracks);
  const playlists = useLibraryStore((state) => state.playlists);
  const lastSyncedAt = useLibraryStore((state) => state.lastSyncedAt);
  const refreshing = useLibraryStore((state) => state.refreshing);
  const refresh = useLibraryStore((state) => state.refresh);
  const setAutoplay = usePlayerStore((state) => state.setAutoplay);
  const applyDefaultVolume = usePlayerStore((state) => state.applyDefaultVolume);
  const volume = usePlayerStore((state) => state.volume);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [defaultVolume, setDefaultVolume] = useState(0.8);
  const [autoplay, setAutoplayState] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    void ensureSettings(user.id)
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setDisplayName(data.display_name ?? (user.user_metadata?.display_name as string) ?? '');
        setDefaultVolume(data.default_volume ?? 0.8);
        setAutoplayState(data.autoplay ?? true);
        setAutoplay(data.autoplay ?? true);
        applyDefaultVolume(data.default_volume ?? 0.8);
      })
      .catch((error: unknown) => {
        if (active) toast.error('Could not load settings', errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyDefaultVolume, setAutoplay, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const cleanName = displayName.trim();
      const next = await updateSettings(user.id, {
        display_name: cleanName || null,
        default_volume: defaultVolume,
        autoplay,
      });
      if (cleanName) {
        await updateProfileDisplayName(user.id, cleanName);
        await supabase.auth.updateUser({ data: { display_name: cleanName } });
      }
      setSettings(next);
      setAutoplay(autoplay);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Could not save settings', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Could not sign out', error.message);
      return;
    }
    navigate('/login', { replace: true });
  };

  const totalDuration = tracks.reduce((total, track) => total + (track.duration ?? 0), 0);
  const storedCount = tracks.filter((track) => track.playback_type === 'stored_audio').length;
  const soundcloudCount = tracks.filter((track) => track.source === 'soundcloud').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Your account, playback defaults and the connection between Telegram and MUSE."
        actions={
          <Button onClick={() => void handleSave()} loading={saving} disabled={loading}>
            <Check className="h-3.5 w-3.5" />
            Save changes
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[240px] w-full rounded-[22px]" />
          ))}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <SettingsCard
            icon={UserRound}
            title="Account"
            description="The identity attached to this private library."
          >
            <div className="space-y-4">
              <Input label="Email" value={user?.email ?? ''} readOnly disabled />
              <Input
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How MUSE greets you"
                maxLength={60}
              />
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <span className="text-[12px] text-bone-400">Account ID</span>
                <code className="max-w-[200px] truncate text-[10.5px] text-bone-600">
                  {user?.id}
                </code>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Volume2}
            title="Playback"
            description="Defaults applied when MUSE opens."
          >
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-bone-500">
                    Default volume
                  </span>
                  <span className="text-[11px] tabular-nums text-bone-400">
                    {Math.round(defaultVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={defaultVolume}
                  onChange={(event) => setDefaultVolume(Number(event.target.value))}
                  aria-label="Default volume"
                  className="range w-full"
                  style={{
                    background: `linear-gradient(to right, rgba(205,191,163,0.85) ${defaultVolume * 100}%, rgba(255,255,255,0.14) ${defaultVolume * 100}%)`,
                  }}
                />
                <p className="mt-2 text-[10.5px] text-bone-600">
                  Current session volume: {Math.round(volume * 100)}%. The default applies on the
                  next visit.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div>
                  <p className="text-[12.5px] font-medium text-bone-200">Autoplay next track</p>
                  <p className="mt-0.5 text-[10.5px] text-bone-600">
                    Continue through the queue when a track ends.
                  </p>
                </div>
                <Toggle checked={autoplay} onChange={setAutoplayState} label="Autoplay next track" />
              </div>

              <p className="text-[10.5px] leading-relaxed text-bone-600">
                SoundCloud tracks are streamed by the official widget. Stored audio uses private
                signed URLs. MUSE never mixes the two playback engines.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Send}
            title="Telegram"
            description="The only door into this library."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-bone-200">MUSE Bot</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-bone-600">
                    {telegramBotUrl.replace('https://', '')}
                  </p>
                </div>
                <a
                  href={telegramBotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-accent-soft hover:underline"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div>
                  <p className="text-[12px] font-medium text-bone-200">Telegram ID</p>
                  <p className="mt-0.5 text-[10.5px] text-bone-600">
                    {settings?.telegram_user_id ?? telegramUser?.id ?? 'Linked on first bot use'}
                  </p>
                </div>
                <ShieldCheck className="h-4 w-4 text-accent" />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div>
                  <p className="text-[12px] font-medium text-bone-200">Mini App</p>
                  <p className="mt-0.5 text-[10.5px] text-bone-600">
                    {isMiniApp ? `Active${platform ? ` · ${platform}` : ''}` : 'Not running inside Telegram'}
                  </p>
                </div>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isMiniApp ? 'bg-[#8fbf9a]' : 'bg-bone-600',
                  )}
                />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Database}
            title="Library"
            description="A snapshot of the collection synced with Supabase."
          >
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Tracks', value: tracks.length },
                { label: 'Playlists', value: playlists.length },
                { label: 'Stored audio', value: storedCount },
                { label: 'SoundCloud', value: soundcloudCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
                >
                  <p className="font-display text-[22px] font-medium tracking-[-0.03em] text-bone-100">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-bone-600">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] text-bone-500">
              <div className="flex items-center justify-between">
                <span>Total listening time</span>
                <span className="text-bone-300">{formatTotalDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last sync</span>
                <span className="text-bone-300">
                  {lastSyncedAt ? formatDate(new Date(lastSyncedAt).toISOString()) : '—'}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              loading={refreshing}
              onClick={() => void refresh({ silent: true })}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync now
            </Button>
          </SettingsCard>

          <SettingsCard
            icon={Cloud}
            title="Storage & privacy"
            description="Private by default, at every layer."
          >
            <div className="space-y-3 text-[11.5px] leading-relaxed text-bone-500">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  Row Level Security restricts every row to your account. The anon key in the
                  browser can only read and write records you own.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <LockIcon />
                <p>
                  The audio bucket is private. Playback links are signed and expire after one hour.
                  SoundCloud artwork stays on SoundCloud’s CDN.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  The bot token and service role key never reach the browser. They live only in
                  the bot’s server environment.
                </p>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={LogOut}
            title="Session"
            description="End this session on this device."
            className="lg:col-span-2"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11.5px] leading-relaxed text-bone-500">
                Signed in as <span className="text-bone-300">{user?.email}</span>. Signing out
                clears the local session; your library stays untouched.
              </p>
              <Button variant="outline" onClick={() => void handleSignOut()} className="shrink-0">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </SettingsCard>
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-[10.5px] text-bone-600 sm:flex-row sm:items-center sm:justify-between">
        <span>MUSE 1.0 · A private music library</span>
        <span>Supabase · React · Telegram</span>
      </footer>
    </div>
  );
}

function LockIcon() {
  return <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />;
}
