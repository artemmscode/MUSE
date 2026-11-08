import { useMemo } from 'react';
import { Clock3, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TrackList } from '@/components/track/TrackList';
import { TrackRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyLibrary } from '@/components/home/EmptyLibrary';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLibraryStore } from '@/stores/libraryStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { telegramBotUrl } from '@/lib/env';
import type { Track } from '@/types';

interface DateGroup {
  label: string;
  tracks: Track[];
}

export function RecentPage() {
  useDocumentTitle('Recently Added');
  const tracks = useLibraryStore((state) => state.tracks);
  const loading = useLibraryStore((state) => state.loading);
  const deleteTrack = useLibraryStore((state) => state.deleteTrack);

  const groups = useMemo<DateGroup[]>(() => {
    if (tracks.length === 0) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const buckets = new Map<string, Track[]>();

    const sorted = [...tracks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    for (const track of sorted) {
      const created = new Date(track.created_at);
      const dayStart = new Date(
        created.getFullYear(),
        created.getMonth(),
        created.getDate(),
      ).getTime();
      const days = Math.floor((startOfToday - dayStart) / 86_400_000);
      let label = 'Earlier';
      if (days <= 0) label = 'Today';
      else if (days === 1) label = 'Yesterday';
      else if (days < 7) label = 'This week';
      else if (days < 30) label = 'This month';
      else if (days < 365) label = 'This year';

      const bucket = buckets.get(label) ?? [];
      bucket.push(track);
      buckets.set(label, bucket);
    }

    const order = ['Today', 'Yesterday', 'This week', 'This month', 'This year', 'Earlier'];
    return order
      .filter((label) => buckets.has(label))
      .map((label) => ({ label, tracks: buckets.get(label) ?? [] }));
  }, [tracks]);

  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track);
      toast.success('Track removed', track.title);
    } catch (error) {
      toast.error('Could not delete track', errorMessage(error));
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Timeline"
        title="Recently Added"
        description="A chronological view of everything that has arrived in your library."
        actions={
          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 text-[12px] font-medium text-bone-200 transition-colors hover:border-white/[0.16] hover:text-bone-50"
          >
            <Send className="h-3.5 w-3.5 text-accent" />
            Add music
          </a>
        }
      />

      {loading && tracks.length === 0 ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <TrackRowSkeleton key={index} />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyLibrary />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Nothing here yet"
          description="Tracks appear here as soon as the bot adds them to your library."
        />
      ) : (
        <div className="space-y-9">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[17px] font-medium tracking-[-0.02em] text-bone-100">
                  {group.label}
                </h2>
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-bone-600">
                  {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>
              <TrackList
                tracks={group.tracks}
                queue={tracks}
                onDelete={handleDelete}
                showAlbum
                showSource
              />
            </section>
          ))}
          <p className="pt-2 text-[10.5px] uppercase tracking-[0.16em] text-bone-600">
            Last sync {formatDate(new Date().toISOString()).toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}
