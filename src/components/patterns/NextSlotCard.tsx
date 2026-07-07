'use client';

import { Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDayHeader, formatSlotRange } from '@/lib/time';
import { t } from '@/lib/i18n';

export interface NextSlotCardProps {
  slot: { projectId: string; projectTitle: string; startTime: string; endTime: string };
  projectTimezone: string;
  now?: number;
}

export function NextSlotCard({ slot, projectTimezone, now = Date.now() }: NextSlotCardProps) {
  const start = Date.parse(slot.startTime);
  const minsUntil = Math.round((start - now) / 60000);
  const soon = minsUntil > 0 && minsUntil <= 60;

  return (
    <Card elevation={1} className="border-accent/30 bg-accent-soft/40">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Flame size={20} className={soon ? 'animate-breathe' : ''} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{t('nextSlotTitle')}</p>
          <p className="truncate text-sm text-ink tnum">
            {formatDayHeader(slot.startTime, projectTimezone)},{' '}
            {formatSlotRange(slot.startTime, slot.endTime, projectTimezone)} {t('oclock')}
          </p>
        </div>
      </div>
    </Card>
  );
}
