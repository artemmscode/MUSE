import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PlayingIndicator({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-3.5 items-end gap-[2px]', className)} aria-label="Playing">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="w-[2px] rounded-full bg-accent"
          animate={{ height: ['25%', '100%', '45%', '85%', '25%'] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.18,
          }}
          style={{ height: '25%' }}
        />
      ))}
    </span>
  );
}
