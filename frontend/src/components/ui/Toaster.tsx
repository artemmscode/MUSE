import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const tones = {
  success: 'text-[#a9c8a9]',
  error: 'text-[#e0a7a7]',
  info: 'text-accent',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--player-height)+var(--safe-bottom)+var(--tg-safe-bottom)+16px)] z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:w-[360px]">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-white/[0.09] bg-ink-800/95 px-4 py-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tones[toast.variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-bone-100">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[12px] leading-snug text-bone-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 -mt-1 rounded-full p-1.5 text-bone-500 transition-colors hover:text-bone-200"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
