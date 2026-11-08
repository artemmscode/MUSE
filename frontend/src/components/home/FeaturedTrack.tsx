import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { CoverArt } from '@/components/ui/CoverArt';
import { PlayButton } from '@/components/ui/PlayButton';
import { Badge, SourceBadge } from '@/components/ui/Badge';
import { formatDate, formatDuration } from '@/lib/format';
import type { Track } from '@/types';

interface FeaturedTrackProps {
  track: Track;
  queue: Track[];
}

export function FeaturedTrack({ track, queue }: FeaturedTrackProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate overflow-hidden rounded-[28px] border border-white/[0.08] bg-ink-850/50"
    >
      {track.cover_url && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img
            src={track.cover_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-125 object-cover opacity-[0.22] blur-[70px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/40 to-ink-950/85" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="grid items-center gap-7 p-6 sm:p-8 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10 md:p-10 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[280px] md:max-w-none">
          <CoverArt
            src={track.cover_url}
            title={track.title}
            artist={track.artist}
            className="aspect-square w-full cover-shadow"
            rounded="rounded-[22px]"
            priority
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Latest addition</Badge>
            <SourceBadge source={track.source} />
          </div>

          <h2 className="mt-4 text-balance font-display text-[32px] font-medium leading-[1.02] tracking-[-0.05em] text-bone-50 sm:text-[42px] lg:text-[50px]">
            {track.title}
          </h2>
          <p className="mt-3 text-[15px] text-bone-300 sm:text-[16px]">{track.artist}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-bone-500">
            {track.album && <span>{track.album}</span>}
            <span className="tabular-nums">{formatDuration(track.duration)}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Added {formatDate(track.created_at).toLowerCase()}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PlayButton
              track={track}
              queue={queue}
              size="lg"
              alwaysVisible
              className="h-12 w-12"
            />
            <span className="text-[11px] uppercase tracking-[0.16em] text-bone-600">Play now</span>
            <Link
              to={`/track/${track.id}`}
              className="group ml-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-bone-300 transition-colors hover:text-bone-50"
            >
              Open track
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
