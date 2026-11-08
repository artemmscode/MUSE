import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ListMusic, Plus, Send } from 'lucide-react';
import { FeaturedTrack } from '@/components/home/FeaturedTrack';
import { EmptyLibrary } from '@/components/home/EmptyLibrary';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TrackGrid } from '@/components/track/TrackGrid';
import { PlaylistCard } from '@/components/playlists/PlaylistCard';
import { HomeSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { greeting, longDate, formatTotalDuration } from '@/lib/format';
import { telegramBotUrl } from '@/lib/env';
import type { Track } from '@/types';

export function HomePage() {
  useDocumentTitle('Home');
  const { user } = useAuth();
  const tracks = useLibraryStore((state) => state.tracks);
  const playlists = useLibraryStore((state) => state.playlists);
  const loading = useLibraryStore((state) => state.loading);
  const deleteTrack = useLibraryStore((state) => state.deleteTrack);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'there';

  const latest = tracks[0];
  const recentAdded = tracks.slice(0, 5);
  const recentlyPlayed = useMemo(
    () =>
      tracks
        .filter((track) => track.last_played_at)
        .sort(
          (a, b) =>
            new Date(b.last_played_at ?? 0).getTime() -
            new Date(a.last_played_at ?? 0).getTime(),
        )
        .slice(0, 5),
    [tracks],
  );
  const totalDuration = tracks.reduce((total, track) => total + (track.duration ?? 0), 0);

  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track);
      toast.success('Track removed', track.title);
    } catch (error) {
      toast.error('Could not delete track', errorMessage(error));
    }
  };

  if (loading && tracks.length === 0) {
    return <HomeSkeleton />;
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
            {longDate()}
          </p>
          <h1 className="mt-3 text-balance font-display text-[38px] font-medium leading-[1.02] tracking-[-0.05em] text-bone-50 sm:text-[52px]">
            {greeting()}, <span className="text-bone-300">{displayName}</span>.
          </h1>
          {tracks.length > 0 && (
            <p className="mt-3 text-[12.5px] text-bone-500">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              {playlists.length > 0 &&
                ` · ${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'}`}
              {totalDuration > 0 && ` · ${formatTotalDuration(totalDuration)} of listening`}
            </p>
          )}
        </div>
        <a
          href={telegramBotUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex w-fit items-center gap-2 text-[12px] font-medium text-bone-400 transition-colors hover:text-bone-100"
        >
          <Send className="h-3.5 w-3.5 text-accent" />
          Send something to MUSE
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </header>

      {tracks.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <>
          {latest && <FeaturedTrack track={latest} queue={tracks} />}

          <section>
            <SectionHeader
              title="Recently added"
              subtitle="The newest arrivals in your collection"
              action={{ label: 'View library', to: '/library' }}
            />
            <TrackGrid tracks={recentAdded} queue={tracks} onDelete={handleDelete} />
          </section>

          {recentlyPlayed.length > 0 && (
            <section>
              <SectionHeader
                title="Recently played"
                subtitle="Pick up where you left off"
                action={{ label: 'View library', to: '/library' }}
              />
              <TrackGrid
                tracks={recentlyPlayed}
                queue={recentlyPlayed}
                onDelete={handleDelete}
              />
            </section>
          )}

          <section>
            <SectionHeader
              title="Your playlists"
              subtitle="Collections with a point of view"
              action={
                playlists.length > 0 ? { label: 'All playlists', to: '/playlists' } : undefined
              }
            >
              <Link
                to="/playlists?new=1"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-bone-400 transition-colors hover:text-bone-100"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </Link>
            </SectionHeader>

            {playlists.length === 0 ? (
              <EmptyState
                icon={ListMusic}
                title="No playlists yet"
                description="Group tracks into moods, eras or late-night rituals. Playlists can mix stored audio and SoundCloud links."
                compact
                action={
                  <Link
                    to="/playlists?new=1"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create a playlist
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {playlists.slice(0, 5).map((playlist, index) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
