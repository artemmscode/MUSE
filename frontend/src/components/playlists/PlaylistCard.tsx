import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { PlaylistCover } from './PlaylistCover';
import { usePlayerStore } from '@/stores/playerStore';
import { fetchPlaylist } from '@/services/playlists';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import { formatTotalDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PlaylistSummary } from '@/types';

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  index?: number;
  className?: string;
}

export function PlaylistCard({ playlist, index = 0, className }: PlaylistCardProps) {
  const [loading, setLoading] = useState(false);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const currentId = usePlayerStore((state) => state.queue[state.currentIndex]?.id ?? null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);

  const active = Boolean(currentId && queue.some((track) => track.id === currentId) && isPlaying);

  const handlePlay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const full = await fetchPlaylist(playlist.id);
      if (full.tracks.length === 0) {
        toast.info('This playlist is empty', 'Add a few tracks first.');
        return;
      }
      playQueue(full.tracks);
    } catch (error) {
      toast.error('Could not play playlist', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn('group min-w-0', className)}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Link to={`/playlists/${playlist.id}`} aria-label={`Open playlist ${playlist.name}`}>
          <div className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]">
            <PlaylistCover
              name={playlist.name}
              coverUrl={playlist.cover_url}
              previewCovers={playlist.preview_covers}
              className="cover-shadow"
            />
          </div>
        </Link>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <button
          type="button"
          onClick={() => void handlePlay()}
          disabled={playlist.track_count === 0 || loading}
          aria-label={`Play ${playlist.name}`}
          className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-1 items-center justify-center rounded-full bg-bone-100 text-ink-950 opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-105 hover:bg-white disabled:opacity-40 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border border-ink-500 border-t-transparent" />
          ) : active ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          )}
        </button>
      </div>

      <div className="mt-3.5">
        <Link to={`/playlists/${playlist.id}`}>
          <h3 className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-bone-100 transition-colors group-hover:text-white">
            {playlist.name}
          </h3>
        </Link>
        <p className="mt-1 text-[11.5px] text-bone-500">
          {playlist.track_count} {playlist.track_count === 1 ? 'track' : 'tracks'}
          {playlist.total_duration > 0 && ` · ${formatTotalDuration(playlist.total_duration)}`}
        </p>
      </div>
    </motion.article>
  );
}
