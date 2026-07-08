'use client';

import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { t, tUnit } from '@/lib/i18n';

export interface ChainProgressProps {
  booked: number;
  total: number;
  largestGap?: { label: string; startTime: string } | null;
  onGapClick?: (startTime: string) => void;
  /** Tages-Wache (slotDurationMinutes=1440): Texte sagen Tage statt Stunden. */
  dayMode?: boolean;
}

export function ChainProgress({ booked, total, largestGap, onGapClick, dayMode }: ChainProgressProps) {
  const complete = total > 0 && booked >= total;

  return (
    <div>
      <p className="font-display text-xl font-semibold text-ink tnum">
        {complete ? (
          t('chainClosed')
        ) : (
          <>
            <span className="font-semibold text-accent-strong">{booked}</span>{' '}
            {tUnit(!!dayMode, 'slotsBookedOfRest', 'slotsBookedOfRestDays', { total })}
          </>
        )}
      </p>
      <Progress
        className="mt-3"
        segmented
        value={booked}
        max={total}
        aria-label={tUnit(!!dayMode, 'slotsBookedOf', 'heldOfDays', { booked, total })}
      />
      {!complete && largestGap && (
        <button
          onClick={() => onGapClick?.(largestGap.startTime)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-accent-strong"
        >
          <span>{t('largestGap', { gap: largestGap.label })}</span>
          <ArrowRight size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
