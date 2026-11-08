import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  trigger: (props: {
    onClick: (event: React.MouseEvent) => void;
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
  }) => ReactNode;
  align?: 'start' | 'end';
  width?: number;
  className?: string;
}

export function Menu({ items, trigger, align = 'end', width = 224, className }: MenuProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 12;
    let left = align === 'end' ? rect.right - width : rect.left;
    left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
    const estimatedHeight = items.length * 42 + 16;
    const top =
      rect.bottom + estimatedHeight > window.innerHeight - margin
        ? Math.max(margin, rect.top - estimatedHeight - 8)
        : rect.bottom + 8;
    setPosition({ top, left });
  }, [align, items.length, open, width]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <>
      <span ref={anchorRef} className="inline-flex">
        {trigger({
          onClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
          },
          'aria-haspopup': 'menu',
          'aria-expanded': open,
        })}
      </span>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                role="menu"
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -2 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ top: position.top, left: position.left, width }}
                className={cn(
                  'fixed z-[100] overflow-hidden rounded-2xl border border-white/[0.09] bg-ink-800/95 p-1.5 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl',
                  className,
                )}
              >
                {items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.label}-${index}`}>
                      {item.separatorBefore && (
                        <div className="mx-2 my-1.5 h-px bg-white/[0.07]" />
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        disabled={item.disabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpen(false);
                          item.onSelect();
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors disabled:opacity-40',
                          item.danger
                            ? 'text-[#e0a7a7] hover:bg-[#3a1d1d]/60'
                            : 'text-bone-200 hover:bg-white/[0.07] hover:text-bone-50',
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
                        <span className="truncate">{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
