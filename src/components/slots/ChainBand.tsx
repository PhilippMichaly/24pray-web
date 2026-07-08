'use client';

import { cn } from '@/lib/utils';
import { formatSlotRange, formatShortWeekdayDate } from '@/lib/time';
import { Tooltip } from '@/components/ui/Tooltip';
import { t, intlLocale } from '@/lib/i18n';
import type { SlotCellState, SlotViewModel } from './types';

export interface ChainBandProps {
  /** Tages-Modus: WOCHEN-Gruppen (7 Tages-Slots je Zeile) statt Kalendertagen. */
  days: { key: string; slots: SlotViewModel[] }[];
  projectTz: string;
  onCellActivate: (slotStartTime: string) => void;
  interactiveTooltip?: boolean; // ≥lg (E4), read-only
  /** Tages-Wache (slotDurationMinutes=1440): 1 Zelle = 1 Tag, 1 Zeile = 1 Woche. */
  dayMode?: boolean;
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

// War früher hart auf 'de-DE' verdrahtet (Bug, unabhängig von der aktiven Locale) — jetzt lokalisiert.
const shortWeekday = (iso: string, tz: string) =>
  new Intl.DateTimeFormat(intlLocale(), { timeZone: tz, weekday: 'short' }).format(new Date(iso));

export function ChainBand({ days, projectTz, onCellActivate, interactiveTooltip, dayMode }: ChainBandProps) {
  return (
    <div className="space-y-1.5" aria-label={t('chainBandLabel')}>
      {days.map((row, rowIndex) => {
        const anyNight = !dayMode && row.slots.some((s) => s.isNight);
        const rowLabel = dayMode ? `W${rowIndex + 1}` : shortWeekday(row.slots[0].startTime, projectTz);
        return (
          <div key={row.key} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-end text-xs tnum text-ink-muted">{rowLabel}</span>
            <div className={cn('grid flex-1 gap-[2px]', dayMode ? 'grid-cols-7' : 'grid-cols-24')}>
              {row.slots.map((slot) => {
                const now = slot.state.startsWith('NOW_');
                const label = dayMode
                  ? formatShortWeekdayDate(slot.startTime, projectTz)
                  : formatSlotRange(slot.startTime, slot.endTime, projectTz);
                const cell = (
                  <button
                    key={slot.key}
                    onClick={() => onCellActivate(slot.startTime)}
                    aria-label={label}
                    className={cn(
                      'relative h-3 rounded-[3px] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus',
                      cellClass(slot.state),
                      !dayMode && slot.isNight && 'ring-1 ring-inset ring-night/20',
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
                        {/* Roher Stunden-Bereich ("07–08") bleibt in RTL-Locales visuell LTR-isoliert
                            (dayMode-Label ist bereits über Intl(locale) lokalisiert formatiert). */}
                        <span dir={dayMode ? undefined : 'ltr'}>{label}</span>
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
