import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, children, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.03em] text-bone-50 sm:text-[21px]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[12.5px] text-bone-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {children}
        {action && (
          <Link
            to={action.to}
            className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-bone-400 transition-colors hover:text-bone-100"
          >
            {action.label}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
