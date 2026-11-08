import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  compact?: boolean;
  showWordmark?: boolean;
}

export function Logo({ className, compact = false, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'relative flex items-center justify-center rounded-[11px] border border-white/10 bg-ink-900',
          compact ? 'h-8 w-8' : 'h-9 w-9',
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} fill="none">
          <path
            d="M7.5 23V14.2c0-2.6 2.1-4.7 4.7-4.7s4.7 2.1 4.7 4.7V23"
            stroke="#E3D8C2"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path d="M17 23V9" stroke="#CDBFA3" strokeWidth="1.9" strokeLinecap="round" />
          <path
            d="M22.5 23V14.5"
            stroke="#E3D8C2"
            strokeWidth="1.9"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="flex items-baseline gap-[3px]">
          <span className="font-display text-[17px] font-semibold tracking-[0.18em] text-bone-50">
            MUSE
          </span>
          <span className="mb-[7px] h-[3px] w-[3px] rounded-full bg-accent/80" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
