import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Cloud,
  Disc3,
  ExternalLink,
  HardDrive,
  ListPlus,
  Lock,
  Play,
  Trash2,
} from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { Button } from '@/components/ui/Button';
import { Badge, SourceBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddToPlaylistModal } from '@/components/playlists/AddToPlaylistModal';
import { PageLoader } from '@/components/ui/Spinner';
import { fetchTrack } from '@/services/tracks';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import {
  formatBytes,
  formatDate,
  formatDuration,
  playbackLabel,
  sourceLabel,
} from '@/lib/format';
import type { Track } from '@/types';

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/[0.055] py-2.5 last:border-0">
      <dt className="shrink-0 text-[10.5px] uppercase tracking-[0.16em] text-bone-600">{label}</dt>
      <dd className="text-right text-[12px] text-bone-300">{value}</dd>
    </div>
  );
}

export function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const deleteTrack = useLibraryStore((state) => state.deleteTrack);

  useDocumentTitle(track?.title ?? 'Track');

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      setError('Track not found.');
      return;
    }
    setLoading(true);
    void fetchTrack(id)
      .then((data) => {
        if (active) {
          setTrack(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err, 'Could not load this track.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <PageLoader />;

  if (error || !track) {
    return (
      <EmptyState
        icon={Disc3}
        title="Track not found"
        description={error ?? 'This track may have been deleted from your library.'}
        action={
          <Link
            to="/library"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to library
          </Link>
        }
      />
    );
  }

  const unavailable = track.playback_type === 'unavailable';

  return (
    <div className="space-y-9">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-bone-500 transition-colors hover:text-bone-200"
      >
        <ArrowLeft className="h-3 w-3" />
        Library
      </Link>

      <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-[300px] md:max-w-none">
          <CoverArt
            src={track.cover_url}
            title={track.title}
            artist={track.artist}
            className="aspect-square w-full cover-shadow"
            rounded="rounded-[24px]"
            priority
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={track.source} />
            {track.album && <Badge tone="muted">{track.album}</Badge>}
            {unavailable && <Badge tone="muted">Unavailable</Badge>}
          </div>

          <h1 className="mt-4 text-balance font-display text-[36px] font-medium leading-[1.02] tracking-[-0.05em] text-bone-50 sm:text-[48px]">
            {track.title}
          </h1>
          <p className="mt-3 text-[16px] text-bone-300">{track.artist}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-bone-500">
            <span className="tabular-nums">{formatDuration(track.duration)}</span>
            {track.genre && <span>{track.genre}</span>}
            {track.year && <span>{track.year}</span>}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Added {formatDate(track.created_at)}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => playTrack(track, [track])}
              disabled={unavailable}
              className="px-5"
            >
              <Play className="h-4 w-4 fill-current" />
              {unavailable ? 'Unavailable' : 'Play'}
            </Button>
            <Button variant="secondary" onClick={() => setPlaylistOpen(true)}>
              <ListPlus className="h-3.5 w-3.5" />
              Add to playlist
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete track"
              className="text-bone-500 hover:text-[#e0a7a7]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {track.source_url && (
              <a
                href={track.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] text-bone-400 transition-colors hover:text-bone-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {track.source === 'soundcloud' ? 'SoundCloud' : 'Source'}
              </a>
            )}
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
            {track.playback_type === 'stored_audio' ? (
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            ) : track.playback_type === 'soundcloud_embed' ? (
              <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            ) : (
              <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bone-500" />
            )}
            <p className="text-[11.5px] leading-relaxed text-bone-500">
              {track.playback_type === 'stored_audio'
                ? 'Stored privately in MUSE Storage. Playback uses short-lived signed URLs available only to your account.'
                : track.playback_type === 'soundcloud_embed'
                  ? 'Playback is handled by the official SoundCloud player. MUSE does not copy or extract the stream.'
                  : 'MUSE saved the reference and metadata, but this track has no playable audio.'}
            </p>
          </div>
        </div>
      </div>

      {track.playback_type === 'soundcloud_embed' && track.source_url && (
        <section className="rounded-2xl border border-white/[0.07] bg-ink-900/50 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-bone-500">
              Official SoundCloud player
            </p>
            <a
              href={track.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-bone-500 hover:text-bone-200"
            >
              Open on SoundCloud
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <iframe
            title={`SoundCloud player for ${track.title}`}
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
              track.source_url,
            )}&color=%23cdbfa3&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`}
            className="overflow-hidden rounded-xl"
          />
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-[17px] font-medium tracking-[-0.02em] text-bone-100">
            Details
          </h2>
          <dl>
            <MetaRow label="Artist" value={track.artist} />
            <MetaRow label="Album" value={track.album ?? '—'} />
            <MetaRow label="Duration" value={formatDuration(track.duration)} />
            <MetaRow label="Source" value={sourceLabel(track.source)} />
            <MetaRow label="Playback" value={playbackLabel(track.playback_type)} />
            <MetaRow label="Added" value={formatDate(track.created_at)} />
          </dl>
        </div>
        <div>
          <h2 className="mb-3 font-display text-[17px] font-medium tracking-[-0.02em] text-bone-100">
            File & activity
          </h2>
          <dl>
            <MetaRow label="Plays" value={String(track.play_count)} />
            <MetaRow label="Last played" value={track.last_played_at ? formatDate(track.last_played_at) : 'Never'} />
            <MetaRow label="Format" value={track.mime_type ?? '—'} />
            <MetaRow label="Size" value={formatBytes(track.file_size)} />
            <MetaRow label="Genre" value={track.genre ?? '—'} />
            <MetaRow label="Year" value={track.year ? String(track.year) : '—'} />
          </dl>
        </div>
      </section>

      <AddToPlaylistModal open={playlistOpen} onClose={() => setPlaylistOpen(false)} track={track} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete track?"
        description={`“${track.title}” will be removed from your library and its private audio file will be deleted.`}
        confirmLabel="Delete track"
        onConfirm={async () => {
          try {
            await deleteTrack(track);
            toast.success('Track removed', track.title);
            navigate('/library');
          } catch (err) {
            toast.error('Could not delete track', errorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
