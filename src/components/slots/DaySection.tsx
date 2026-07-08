'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DaySectionProps {
  dateLabel: string;
  dayProgress: { booked: number; total: number };
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export function DaySection({ dateLabel, dayProgress, defaultCollapsed, children }: DaySectionProps) {
  const [open, setOpen] = useState(!defaultCollapsed);
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="sticky top-16 z-10 -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 bg-bg/85 px-4 py-2 text-left backdrop-blur focus-visible:outline-none"
      >
        <ChevronDown
          size={16}
          className={cn('text-ink-muted transition-transform', !open && '-rotate-90')}
          aria-hidden
        />
        <span className="text-sm font-medium capitalize text-ink">{dateLabel}</span>
        <span className="ml-auto text-xs tnum text-ink-muted">
          {dayProgress.booked}/{dayProgress.total}
        </span>
      </button>
      {open && <ul className="mt-1 space-y-1.5">{children}</ul>}
    </section>
  );
}
