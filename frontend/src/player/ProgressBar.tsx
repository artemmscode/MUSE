import { useRef, useState, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  max,
  onSeek,
  disabled = false,
  className,
  label = 'Playback position',
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const safeMax = max > 0 ? max : 1;
  const displayed = dragging ? dragValue : value;
  const percent = Math.min(Math.max((displayed / safeMax) * 100, 0), 100);

  const valueFromEvent = (event: PointerEvent<HTMLDivElement>): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    return ratio * max;
  };

  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-disabled={disabled}
      className={cn(
        'progress-track touch-none select-none',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
      onPointerDown={(event) => {
        if (disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        setDragValue(valueFromEvent(event));
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        setDragValue(valueFromEvent(event));
      }}
      onPointerUp={(event) => {
        if (!dragging) return;
        const next = valueFromEvent(event);
        setDragging(false);
        onSeek(next);
      }}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          onSeek(Math.min(value + 5, max));
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onSeek(Math.max(value - 5, 0));
        } else if (event.key === 'Home') {
          event.preventDefault();
          onSeek(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          onSeek(max);
        }
      }}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
      <div className="progress-thumb" style={{ left: `${percent}%` }} />
    </div>
  );
}
