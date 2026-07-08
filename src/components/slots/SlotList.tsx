'use client';

import { formatDayHeader, formatWeekday } from '@/lib/time';
import { isGapStart, dayCollapseState, leadingPastCount } from './logic';
import { SlotRow } from './SlotRow';
import { DaySection } from './DaySection';
import { t } from '@/lib/i18n';
import type { SlotViewModel } from './types';

export interface SlotListProps {
  days: { key: string; slots: SlotViewModel[] }[];
  projectTz: string;
  onBook: (slot: SlotViewModel) => void;
  onOpenSheet: (slot: SlotViewModel) => void;
  /** Erster Slot der größten Lücke — für die einmalige Kopfzeile (P1). */
  gapStartTime?: string | null;
  gapCount?: number;
}

/** Nicht-interaktive, gedämpfte Zeile für gefaltete vergangene Stunden (P2). */
function PastFoldRow({ count }: { count: number }) {
  return (
    <li className="flex min-h-[36px] items-center px-4 py-1.5 text-sm italic text-ink-muted opacity-40">
      {t('pastFoldLabel', { n: count })}
    </li>
  );
}

/** Dezente Kopfzeile am Beginn der größten Lücke — erscheint genau einmal (P1). */
function GapRangeHeader({ count }: { count: number }) {
  return (
    <li className="flex items-center gap-2 border-l-2 border-gold py-1 pl-3 text-xs font-medium text-ink-muted">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
      {t('gapRangeHeader', { n: count })}
    </li>
  );
}

export function SlotList({ days, projectTz, onBook, onOpenSheet, gapStartTime = null, gapCount = 0 }: SlotListProps) {
  const renderRow = (slot: SlotViewModel) => (
    <>
      {isGapStart(slot, gapStartTime) && <GapRangeHeader key={`gap-${slot.key}`} count={gapCount} />}
      <SlotRow
        key={slot.key}
        slot={slot}
        projectTz={projectTz}
        onBook={() => onBook(slot)}
        onOpen={() => onOpenSheet(slot)}
      />
    </>
  );

  return (
    <div className="space-y-5">
      {days.map((day) => {
        const collapse = dayCollapseState(day.slots);

        // Komplett vergangener Tag → eine Ghost-Zeile statt der ganzen Sektion.
        if (collapse === 'all-past') {
          return (
            <ul key={day.key}>
              <PastFoldRow count={day.slots.length} />
            </ul>
          );
        }

        const booked = day.slots.filter((s) => s.status === 'BOOKED').length;
        const containsGapStart = day.slots.some((s) => isGapStart(s, gapStartTime));

        if (collapse === 'future-free') {
          const weekday = formatWeekday(day.slots[0].startTime, projectTz);
          let header = t('dayFutureFreeHeader', { weekday, n: day.slots.length });
          if (containsGapStart) header += ` · ${t('largestGapSuffix')}`;
          return (
            <DaySection
              key={day.key}
              dateLabel={formatDayHeader(day.slots[0].startTime, projectTz)}
              dayProgress={{ booked, total: day.slots.length }}
              defaultCollapsed
              headerOverride={header}
            >
              {day.slots.map(renderRow)}
            </DaySection>
          );
        }

        // normal: führende vergangene Slots zu einer Ghost-Zeile falten, Rest normal rendern.
        const leadingPast = leadingPastCount(day.slots);
        const rest = day.slots.slice(leadingPast);
        return (
          <DaySection
            key={day.key}
            dateLabel={formatDayHeader(day.slots[0].startTime, projectTz)}
            dayProgress={{ booked, total: day.slots.length }}
          >
            {leadingPast > 0 && <PastFoldRow key={`past-${day.key}`} count={leadingPast} />}
            {rest.map(renderRow)}
          </DaySection>
        );
      })}
    </div>
  );
}
