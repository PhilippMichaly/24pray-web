import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number;
  max: number;
  segmented?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Linearer Balken ODER segmentiert. ChainProgress (Welle 2) nutzt segmented.
export function Progress({ value, max, segmented, className, ...aria }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const complete = value >= max && max > 0;

  if (segmented) {
    return (
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        {...aria}
        className={cn('flex gap-[2px]', className)}
      >
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 flex-1 rounded-[2px] transition-colors',
              i < value ? (complete ? 'bg-gold' : 'bg-accent') : 'bg-surface-sunken',
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      {...aria}
      className={cn('h-2 overflow-hidden rounded-full bg-surface-sunken', className)}
    >
      <span
        className={cn('block h-full rounded-full transition-all', complete ? 'bg-gold' : 'bg-accent')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
