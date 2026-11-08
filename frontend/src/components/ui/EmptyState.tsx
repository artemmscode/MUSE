import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  hint?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.018] px-6 text-center',
        compact ? 'py-12' : 'py-20 sm:py-24',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl border border-white/[0.08] bg-ink-850 text-accent',
          compact ? 'h-12 w-12' : 'h-16 w-16',
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-accent/[0.06] blur-xl" />
        <Icon className={compact ? 'relative h-5 w-5' : 'relative h-7 w-7'} strokeWidth={1.4} />
      </div>
      <h3
        className={cn(
          'mt-6 font-display font-medium tracking-[-0.03em] text-bone-50',
          compact ? 'text-lg' : 'text-[22px]',
        )}
      >
        {title}
      </h3>
      <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-bone-400">{description}</p>
      {action && <div className="mt-7">{action}</div>}
      {hint && <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-bone-600">{hint}</p>}
    </div>
  );
}
