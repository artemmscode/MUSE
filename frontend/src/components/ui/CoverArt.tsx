import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { coverGradient, initials } from '@/lib/format';

interface CoverArtProps {
  src?: string | null;
  title: string;
  artist?: string | null;
  className?: string;
  imageClassName?: string;
  rounded?: string;
  priority?: boolean;
}

export function CoverArt({
  src,
  title,
  artist,
  className,
  imageClassName,
  rounded = 'rounded-xl',
  priority = false,
}: CoverArtProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-ink-800',
        rounded,
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? ''}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
            imageClassName,
          )}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center bg-gradient-to-br',
            coverGradient(`${title}-${artist ?? ''}`),
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full opacity-[0.12]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="coverLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E3D8C2" />
                <stop offset="100%" stopColor="#E3D8C2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="78" cy="18" r="46" fill="none" stroke="url(#coverLine)" strokeWidth="0.5" />
            <circle cx="78" cy="18" r="34" fill="none" stroke="url(#coverLine)" strokeWidth="0.5" />
            <circle cx="78" cy="18" r="22" fill="none" stroke="url(#coverLine)" strokeWidth="0.5" />
          </svg>
          <span className="relative font-display text-[clamp(18px,22%,48px)] font-medium tracking-[-0.05em] text-bone-100/45">
            {initials(title, artist)}
          </span>
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.07]" />
    </div>
  );
}
