import { CoverArt } from '@/components/ui/CoverArt';
import { cn } from '@/lib/utils';

interface PlaylistCoverProps {
  name: string;
  coverUrl?: string | null;
  previewCovers?: string[];
  className?: string;
  rounded?: string;
}

export function PlaylistCover({
  name,
  coverUrl,
  previewCovers = [],
  className,
  rounded = 'rounded-2xl',
}: PlaylistCoverProps) {
  if (coverUrl) {
    return (
      <CoverArt
        src={coverUrl}
        title={name}
        className={cn('aspect-square w-full', className)}
        rounded={rounded}
      />
    );
  }

  const covers = previewCovers.filter(Boolean).slice(0, 4);

  if (covers.length === 0) {
    return (
      <CoverArt
        src={null}
        title={name}
        className={cn('aspect-square w-full', className)}
        rounded={rounded}
      />
    );
  }

  if (covers.length === 1) {
    return (
      <CoverArt
        src={covers[0]}
        title={name}
        className={cn('aspect-square w-full', className)}
        rounded={rounded}
      />
    );
  }

  return (
    <div
      className={cn(
        'grid aspect-square w-full gap-[2px] overflow-hidden bg-ink-800',
        covers.length === 2 ? 'grid-cols-2 grid-rows-1' : 'grid-cols-2 grid-rows-2',
        rounded,
        className,
      )}
    >
      {covers.map((cover, index) => (
        <div
          key={`${cover}-${index}`}
          className={cn(
            'min-h-0 min-w-0 overflow-hidden',
            covers.length === 3 && index === 0 && 'row-span-2',
          )}
        >
          <CoverArt
            src={cover}
            title={name}
            className="h-full w-full"
            rounded="rounded-none"
          />
        </div>
      ))}
    </div>
  );
}
