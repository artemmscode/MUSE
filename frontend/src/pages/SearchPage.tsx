import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { TrackGrid } from '@/components/track/TrackGrid';
import { PlaylistCard } from '@/components/playlists/PlaylistCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLibraryStore } from '@/stores/libraryStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { formatTotalDuration } from '@/lib/format';
import type { Track } from '@/types';

export function SearchPage() {
  useDocumentTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const deferredQuery = useDeferredValue(query);
  const tracks = useLibraryStore((state) => state.tracks);
  const playlists = useLibraryStore((state) => state.playlists);
  const deleteTrack = useLibraryStore((state) => state.deleteTrack);

  useEffect(() => {
    const next = searchParams.get('q') ?? '';
    setQuery((current) => (current === next ? current : next));
  }, [searchParams]);

  const clean = deferredQuery.trim().toLowerCase();

  const matchedTracks = useMemo(() => {
    if (!clean) return [];
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(clean) ||
        track.artist.toLowerCase().includes(clean) ||
        (track.album ?? '').toLowerCase().includes(clean),
    );
  }, [clean, tracks]);

  const matchedPlaylists = useMemo(() => {
    if (!clean) return [];
    return playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(clean) ||
        (playlist.description ?? '').toLowerCase().includes(clean),
    );
  }, [clean, playlists]);

  const totalDuration = tracks.reduce((total, track) => total + (track.duration ?? 0), 0);
  const hasResults = matchedTracks.length > 0 || matchedPlaylists.length > 0;

  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track);
      toast.success('Track removed', track.title);
    } catch (error) {
      toast.error('Could not delete track', errorMessage(error));
    }
  };

  return (
    <div className="space-y-9">
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
          Global search
        </p>
        <h1 className="mt-3 font-display text-[34px] font-medium tracking-[-0.045em] text-bone-50 sm:text-[42px]">
          Find anything.
        </h1>
        <div className="mt-6 flex h-[52px] w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 transition-colors focus-within:border-white/[0.18] focus-within:bg-white/[0.045]">
          <Search className="h-[18px] w-[18px] shrink-0 text-bone-500" />
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setSearchParams(value.trim() ? { q: value } : {}, { replace: true });
            }}
            placeholder="Tracks, artists, albums, playlists…"
            aria-label="Search your library"
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchParams({}, { replace: true });
              }}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-full text-bone-500 transition-colors hover:bg-white/[0.06] hover:text-bone-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {!clean ? (
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.018] p-7 sm:p-9">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
              Your collection
            </p>
            <p className="mt-4 font-display text-[30px] font-medium leading-[1.05] tracking-[-0.04em] text-bone-50">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}, {playlists.length}{' '}
              {playlists.length === 1 ? 'playlist' : 'playlists'}.
            </p>
            <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-bone-500">
              Search is instant and local: titles, artists, albums and playlists update as you
              type. No requests, no waiting.
            </p>
            <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-bone-600">
              {formatTotalDuration(totalDuration)} of music
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.018] p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-accent/10" />
            <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-accent/10" />
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-bone-500">
              Try
            </p>
            <ul className="mt-4 space-y-2 text-[12.5px] text-bone-400">
              <li>an artist you return to</li>
              <li>an album name</li>
              <li>a word from a track title</li>
              <li>one of your playlists</li>
            </ul>
          </div>
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title={`No results for “${deferredQuery.trim()}”`}
          description="Try a shorter phrase, a different spelling, or search for an artist instead of a title."
        />
      ) : (
        <div className="space-y-10">
          <p className="text-[11px] text-bone-500">
            {matchedTracks.length + matchedPlaylists.length}{' '}
            {matchedTracks.length + matchedPlaylists.length === 1 ? 'result' : 'results'} for “
            {deferredQuery.trim()}”
          </p>

          {matchedTracks.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-[18px] font-medium tracking-[-0.02em] text-bone-100">
                  Tracks
                </h2>
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-bone-600">
                  {matchedTracks.length}
                </span>
              </div>
              <TrackGrid
                tracks={matchedTracks}
                queue={matchedTracks}
                onDelete={handleDelete}
              />
            </section>
          )}

          {matchedPlaylists.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-[18px] font-medium tracking-[-0.02em] text-bone-100">
                  Playlists
                </h2>
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-bone-600">
                  {matchedPlaylists.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {matchedPlaylists.map((playlist, index) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
