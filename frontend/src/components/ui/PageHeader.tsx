import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-white/[0.06] pb-7 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-bone-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance font-display text-[34px] font-medium leading-[1.05] tracking-[-0.045em] text-bone-50 sm:text-[42px]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-bone-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </header>
  );
}
