import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-bone-100 text-ink-950 hover:bg-white active:bg-bone-200 shadow-[0_8px_30px_-12px_rgba(242,240,234,0.35)]',
  secondary:
    'bg-white/[0.07] text-bone-100 hover:bg-white/[0.11] active:bg-white/[0.08] border border-white/[0.06]',
  ghost: 'text-bone-300 hover:text-bone-50 hover:bg-white/[0.06] active:bg-white/[0.04]',
  outline:
    'border border-white/[0.12] text-bone-100 hover:border-white/[0.22] hover:bg-white/[0.04]',
  danger:
    'bg-[#3a1d1d] text-[#f0c9c9] hover:bg-[#482323] border border-[#5a2a2a]/60',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-4 text-[13px]',
  md: 'h-11 rounded-full px-5 text-sm',
  lg: 'h-12 rounded-full px-6 text-[15px]',
  icon: 'h-10 w-10 rounded-full',
  'icon-sm': 'h-8 w-8 rounded-full',
};

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
