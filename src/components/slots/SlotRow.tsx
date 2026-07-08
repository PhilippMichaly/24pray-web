'use client';

import { Moon, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSlotRange, formatShortWeekdayDate } from '@/lib/time';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { t, tUnit } from '@/lib/i18n';
import type { SlotViewModel } from './types';

export interface SlotRowProps {
  slot: SlotViewModel;
  projectTz: string;
  onBook: () => void;
  onOpen: () => void;
  /** Tages-Wache (slotDurationMinutes=1440): Zeile = ein Tag statt einer Stunde. */
  dayMode?: boolean;
}

const isNowState = (s: string) => s.startsWith('NOW_');

export function SlotRow({ slot, projectTz, onBook, onOpen, dayMode }: SlotRowProps) {
  const { state } = slot;
  const past = state === 'PAST';
  const mine = state === 'MINE' || state === 'NOW_MINE';
  const booked = state === 'BOOKED' || state === 'NOW_BOOKED';
  const free = state === 'FREE' || state === 'FREE_LARGEST_GAP' || state === 'NOW_FREE';
  const pending = state === 'PENDING';
  const conflict = state === 'CONFLICT';
  const gap = state === 'FREE_LARGEST_GAP';
  const now = isNowState(state);
  const clickable = booked || mine; // öffnet Sheet (Info bzw. Storno)

  return (
    <li
      id={`s-${slot.key}`}
      className={cn(
        'relative flex min-h-[52px] items-center gap-3 rounded-md border px-4 py-2.5 transition-colors',
        free && 'border-dashed bg-surface',
        gap && 'bg-gold/5',
        booked && 'border-solid bg-surface-sunken',
        mine && 'border-solid bg-accent-soft ring-1 ring-accent/40',
        past && 'opacity-40',
        pending && 'opacity-60',
        conflict && 'animate-shake border-danger',
        now && 'border-l-[3px] border-l-gold',
        clickable && 'cursor-pointer hover:shadow-1',
      )}
      onClick={clickable ? onOpen : undefined}
    >
      {/* Zeit — Tages-Modus: kurzes Datum statt Stunden-Bereich, kein Mond-Flag (P3) */}
      <span className={cn('flex shrink-0 items-center gap-1 text-sm tnum text-ink', dayMode ? 'w-20' : 'w-16')}>
        {!dayMode && slot.isNight && <Moon size={13} className="text-night" aria-hidden />}
        {now && <Flame size={13} className="animate-breathe text-gold" aria-hidden />}
        {dayMode ? formatShortWeekdayDate(slot.startTime, projectTz) : formatSlotRange(slot.startTime, slot.endTime, projectTz)}
      </span>

      {/* Mitte */}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-sm">
          {mine ? (
            <>
              <Avatar name={slot.userName} size="sm" variant="mine" />
              <span className="font-medium text-ink">{t('you')}</span>
            </>
          ) : booked ? (
            <>
              <Avatar name={slot.userName} size="sm" />
              <span className="truncate text-ink">{slot.userName ?? '—'}</span>
            </>
          ) : (
            <span className="text-ink-muted">{t('free')}</span>
          )}
        </span>
      </span>

      {/* Rechts */}
      {free && (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 hover:bg-accent hover:text-bg"
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
        >
          {tUnit(!!dayMode, 'take', 'takeDay')}
        </Button>
      )}
      {pending && <Spinner size={16} className="shrink-0 text-accent" />}
    </li>
  );
}
