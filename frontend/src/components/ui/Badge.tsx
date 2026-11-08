import { Cloud, HardDrive, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackSource } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'accent' | 'muted';
}

export function Badge({ children, className, tone = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]',
        tone === 'default' && 'border-white/[0.08] bg-white/[0.04] text-bone-300',
        tone === 'accent' && 'border-accent/20 bg-accent/[0.08] text-accent-soft',
        tone === 'muted' && 'border-white/[0.06] bg-transparent text-bone-500',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SourceBadge({ source, className }: { source: TrackSource; className?: string }) {
  const Icon = source === 'soundcloud' ? Cloud : source === 'telegram_upload' ? UploadCloud : HardDrive;
  const label =
    source === 'soundcloud' ? 'SoundCloud' : source === 'telegram_upload' ? 'Telegram' : 'Local';
  return (
    <Badge className={className}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
