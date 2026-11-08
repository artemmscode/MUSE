import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, icon, trailing, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-bone-500">
          {label}
        </span>
      )}
      <span
        className={cn(
          'flex h-11 items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 transition-colors focus-within:border-white/[0.2] focus-within:bg-white/[0.05]',
          error && 'border-[#7a3a3a]',
          className,
        )}
      >
        {icon && <span className="shrink-0 text-bone-500">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-bone-100 placeholder:text-bone-600 focus:outline-none"
          {...props}
        />
        {trailing}
      </span>
      {(hint || error) && (
        <span
          className={cn(
            'mt-2 block text-[11.5px] leading-relaxed',
            error ? 'text-[#e0a7a7]' : 'text-bone-500',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
});
