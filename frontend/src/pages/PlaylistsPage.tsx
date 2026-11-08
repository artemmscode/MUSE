import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListMusic, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlaylistCard } from '@/components/playlists/PlaylistCard';
import { PlaylistFormModal } from '@/components/playlists/PlaylistFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLibraryStore } from '@/stores/libraryStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';

export function PlaylistsPage() {
  useDocumentTitle('Playlists');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const playlists = useLibraryStore((state) => state.playlists);
  const loading = useLibraryStore((state) => state.loading);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Curated by you"
        title="Playlists"
        description="Moods, rituals and sequences. Mix stored audio with SoundCloud links in any order."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
            New playlist
          </button>
        }
      />

      {loading && playlists.length === 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="mt-3.5 h-3.5 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="No playlists yet"
          description="A playlist can be a mood, a season, a commute or a single perfect sequence. Start with a name — add tracks as you go."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-bone-100 px-4 text-[12.5px] font-medium text-ink-950 transition-colors hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first playlist
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {playlists.map((playlist, index) => (
            <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
          ))}
        </div>
      )}

      <PlaylistFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (input) => {
          try {
            const id = await createPlaylist(input);
            toast.success('Playlist created', input.name);
            navigate(`/playlists/${id}`);
          } catch (error) {
            toast.error('Could not create playlist', errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}
