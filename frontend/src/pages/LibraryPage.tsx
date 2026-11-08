import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowDownUp,
  ArrowUpAZ,
  Check,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TrackGrid } from '@/components/track/TrackGrid';
import { TrackList } from '@/components/track/TrackList';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyLibrary } from '@/components/home/EmptyLibrary';
import { Menu } from '@/components/ui/Menu';
import { TrackCardSkeleton, TrackRowSkeleton } from '@/components/ui/Skeleton';
import { useLibraryStore } from '@/stores/libraryStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { safeStorageGet, safeStorageSet, cn } from '@/lib/utils';
import { formatTotalDuration } from '@/lib/format';
import type { SortDirection, SortField, SourceFilter, Track, ViewMode } from '@/types';

const sortLabels: Record<SortField, string> = {
  created_at: 'Recently added',
  title: 'Title',
  artist: 'Artist',
};

const sourceFilters: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'upload', label: 'Uploads' },
];

export function LibraryPage() {
  useDocumentTitle('Your Library');
  const tracks = useLibraryStore((state) => state.tracks);
  const loading = useLibraryStore((state) => state.loading);
  const deleteTrack = useLibraryStore((state) => state.deleteTrack);

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [sort, setSort] = useState<SortField>('created_at');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [view, setView] = useState<ViewMode>(() =>
    safeStorageGet('muse-library-view') === 'list' ? 'list' : 'grid',
  );

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    safeStorageSet('muse-library-view', view);
  }, [view]);

  const filtered = useMemo(() => {
    const clean = deferredQuery.trim().toLowerCase();
    const result = tracks.filter((track) => {
      if (source === 'soundcloud' && track.source !== 'soundcloud') return false;
      if (
        source === 'upload' &&
        track.source !== 'telegram_upload' &&
        track.source !== 'local'
      ) {
        return false;
      }
      if (!clean) return true;
      return (
        track.title.toLowerCase().includes(clean) ||
        track.artist.toLowerCase().includes(clean) ||
        (track.album ?? '').toLowerCase().includes(clean)
      );
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sort === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sort === 'title') {
        comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      } else {
        comparison = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
      }
      return direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [deferredQuery, direction, sort, source, tracks]);

  const totalDuration = tracks.reduce((total, track) => total + (track.duration ?? 0), 0);
  const hasFilters = query.trim().length > 0 || source !== 'all';

  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track);
      toast.success('Track removed', track.title);
    } catch (error) {
      toast.error('Could not delete track', errorMessage(error));
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSource('all');
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Collection"
        title="Your Library"
        description={
          tracks.length > 0
            ? `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} · ${formatTotalDuration(totalDuration)} of music, all in one place.`
            : 'Every track you send to MUSE lives here.'
        }
      />

      {tracks.length === 0 && !loading ? (
        <EmptyLibrary />
      ) : (
        <>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 transition-colors focus-within:border-white/[0.16] sm:max-w-[340px]">
                <Search className="h-4 w-4 shrink-0 text-bone-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search library"
                  aria-label="Search library"
                  className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
                {sourceFilters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSource(item.value)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors',
                      source === item.value
                        ? 'bg-white/[0.09] text-bone-50'
                        : 'text-bone-500 hover:text-bone-200',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Menu
                items={[
                  {
                    label: 'Recently added',
                    icon: sort === 'created_at' ? Check : undefined,
                    onSelect: () => setSort('created_at'),
                  },
                  {
                    label: 'Title',
                    icon: sort === 'title' ? Check : undefined,
                    onSelect: () => setSort('title'),
                  },
                  {
                    label: 'Artist',
                    icon: sort === 'artist' ? Check : undefined,
                    onSelect: () => setSort('artist'),
                  },
                ]}
                trigger={(props) => (
                  <button
                    type="button"
                    {...props}
                    className="flex h-10 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3.5 text-[11.5px] font-medium text-bone-300 transition-colors hover:border-white/[0.14] hover:text-bone-100"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-bone-500" />
                    {sortLabels[sort]}
                  </button>
                )}
              />

              <button
                type="button"
                onClick={() => setDirection((value) => (value === 'asc' ? 'desc' : 'asc'))}
                aria-label={direction === 'asc' ? 'Sort descending' : 'Sort ascending'}
                title={direction === 'asc' ? 'Ascending' : 'Descending'}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-bone-400 transition-colors hover:border-white/[0.14] hover:text-bone-100"
              >
                {direction === 'asc' ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4" />
                )}
              </button>

              <div className="ml-1 flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    view === 'grid'
                      ? 'bg-white/[0.09] text-bone-50'
                      : 'text-bone-500 hover:text-bone-200',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    view === 'list'
                      ? 'bg-white/[0.09] text-bone-50'
                      : 'text-bone-500 hover:text-bone-200',
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-bone-600">
            <span>
              {loading
                ? 'Syncing…'
                : `${filtered.length} ${filtered.length === 1 ? 'track' : 'tracks'}${
                    hasFilters ? ` of ${tracks.length}` : ''
                  }`}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <ArrowDownUp className="h-3 w-3" />
              {sortLabels[sort]} · {direction === 'asc' ? 'ascending' : 'descending'}
            </span>
          </div>

          {loading && tracks.length === 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <TrackCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {Array.from({ length: 10 }).map((_, index) => (
                  <TrackRowSkeleton key={index} />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No tracks match"
              description="Try a different search, or clear the filters to see your whole library."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
                >
                  Clear filters
                </button>
              }
            />
          ) : view === 'grid' ? (
            <TrackGrid tracks={filtered} queue={filtered} onDelete={handleDelete} />
          ) : (
            <TrackList
              tracks={filtered}
              queue={filtered}
              onDelete={handleDelete}
              showAlbum
              showSource
            />
          )}
        </>
      )}
    </div>
  );
}
