'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface DaySectionProps {
  dateLabel: string;
  dayProgress: { booked: number; total: number };
  defaultCollapsed?: boolean;
  /** Ersetzt Datum+Zähler durch eine eigene Zeile, z. B. „Montag — noch ganz frei · 8 Stunden zu vergeben" (P2). */
  headerOverride?: string;
  children: React.ReactNode;
}

export function DaySection({ dateLabel, dayProgress, defaultCollapsed, headerOverride, children }: DaySectionProps) {
  const [open, setOpen] = useState(!defaultCollapsed);
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="sticky top-16 z-10 -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 bg-bg/85 px-4 py-2 text-left backdrop-blur focus-visible:outline-none"
      >
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-ink-muted transition-transform', !open && '-rotate-90')}
          aria-hidden
        />
        {headerOverride ? (
          <span className="text-sm font-medium text-ink">{headerOverride}</span>
        ) : (
          <>
            <span className="text-sm font-medium capitalize text-ink">{dateLabel}</span>
            <span className="ml-auto text-xs tnum text-ink-muted">
              {t('dayHeldCount', { held: dayProgress.booked, total: dayProgress.total })}
            </span>
          </>
        )}
      </button>
      {open && <ul className="mt-1 space-y-1.5">{children}</ul>}
    </section>
  );
}
