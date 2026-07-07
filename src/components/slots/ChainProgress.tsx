'use client';

import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { t } from '@/lib/i18n';

export interface ChainProgressProps {
  booked: number;
  total: number;
  largestGap?: { label: string; startTime: string } | null;
  onGapClick?: (startTime: string) => void;
}

export function ChainProgress({ booked, total, largestGap, onGapClick }: ChainProgressProps) {
  const complete = total > 0 && booked >= total;

  return (
    <div>
      <p className="font-display text-xl font-semibold text-ink tnum">
        {complete ? t('chainClosed') : t('slotsBookedOf', { booked, total })}
      </p>
      <Progress
        className="mt-3"
        segmented
        value={booked}
        max={total}
        aria-label={t('slotsBookedOf', { booked, total })}
      />
      {!complete && largestGap && (
        <button
          onClick={() => onGapClick?.(largestGap.startTime)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-accent"
        >
          <span>{t('largestGap', { gap: largestGap.label })}</span>
          <ArrowRight size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
