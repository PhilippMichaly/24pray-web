'use client';

import { cn } from '@/lib/utils';
import { formatSlotRange } from '@/lib/time';
import { Tooltip } from '@/components/ui/Tooltip';
import { t } from '@/lib/i18n';
import type { SlotCellState, SlotViewModel } from './types';

export interface ChainBandProps {
  days: { key: string; slots: SlotViewModel[] }[];
  projectTz: string;
  onCellActivate: (slotStartTime: string) => void;
  interactiveTooltip?: boolean; // ≥lg (E4), read-only
}

// Farbe je Zustand (Heatmap). KEINE Buchung aus dem Band (Fixpunkt 4).
// Gebuchte/eigene Zellen bekommen einen warmen Glow (Lichtband-Signatur, P4); freie bleiben matt.
function cellClass(state: SlotCellState): string {
  switch (state) {
    case 'MINE':
    case 'NOW_MINE':
      return 'bg-accent shadow-[0_0_6px_1px_hsl(var(--gold)/0.45)]';
    case 'BOOKED':
    case 'NOW_BOOKED':
      return 'bg-accent/55 shadow-[0_0_6px_1px_hsl(var(--gold)/0.45)]';
    case 'PENDING':
      return 'bg-accent/30 animate-pulse';
    case 'CONFLICT':
      return 'bg-danger/60';
    case 'FREE_LARGEST_GAP':
      return 'bg-gold/25';
    case 'PAST':
      return 'bg-surface-sunken opacity-50';
    default:
      return 'bg-surface-sunken';
  }
}

const shortWeekday = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: tz, weekday: 'short' }).format(new Date(iso));

export function ChainBand({ days, projectTz, onCellActivate, interactiveTooltip }: ChainBandProps) {
  return (
    <div className="space-y-1.5" aria-label={t('chainBandLabel')}>
      {days.map((day) => {
        const anyNight = day.slots.some((s) => s.isNight);
        return (
          <div key={day.key} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-right text-xs tnum text-ink-muted">
              {shortWeekday(day.slots[0].startTime, projectTz)}
            </span>
            <div className={cn('grid flex-1 gap-[2px]', 'grid-cols-24')}>
              {day.slots.map((slot) => {
                const now = slot.state.startsWith('NOW_');
                const cell = (
                  <button
                    key={slot.key}
                    onClick={() => onCellActivate(slot.startTime)}
                    aria-label={formatSlotRange(slot.startTime, slot.endTime, projectTz)}
                    className={cn(
                      'relative h-3 rounded-[3px] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus',
                      cellClass(slot.state),
                      slot.isNight && 'ring-1 ring-inset ring-night/20',
                    )}
                  >
                    {now && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-gold" />
                      </span>
                    )}
                  </button>
                );
                return interactiveTooltip ? (
                  <Tooltip
                    key={slot.key}
                    content={
                      <span className="tnum">
                        {formatSlotRange(slot.startTime, slot.endTime, projectTz)}
                        {slot.userName ? ` · ${slot.isMine ? t('you') : slot.userName}` : ` · ${t('free')}`}
                      </span>
                    }
                  >
                    {cell}
                  </Tooltip>
                ) : (
                  cell
                );
              })}
            </div>
            {anyNight && <span className="w-3" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}
