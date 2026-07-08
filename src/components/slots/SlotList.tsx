'use client';

import { formatDayHeader, formatWeekday, formatDateShort } from '@/lib/time';
import { isGapStart, dayCollapseState, leadingPastCount } from './logic';
import { SlotRow } from './SlotRow';
import { DaySection } from './DaySection';
import { t, tUnit } from '@/lib/i18n';
import type { SlotViewModel } from './types';

export interface SlotListProps {
  days: { key: string; slots: SlotViewModel[] }[];
  projectTz: string;
  onBook: (slot: SlotViewModel) => void;
  onOpenSheet: (slot: SlotViewModel) => void;
  /** Erster Slot der größten Lücke — für die einmalige Kopfzeile (P1). */
  gapStartTime?: string | null;
  gapCount?: number;
  /**
   * Tages-Wache (slotDurationMinutes=1440): `days` sind dann WOCHEN-Gruppen (7 Tages-Slots
   * je Block, siehe groupByWeek) statt Kalendertagen — jede Zeile ist bereits ein ganzer Tag.
   */
  dayMode?: boolean;
}

/** Nicht-interaktive, gedämpfte Zeile für gefaltete vergangene Stunden/Tage (P2). */
function PastFoldRow({ count, dayMode }: { count: number; dayMode: boolean }) {
  return (
    <li className="flex min-h-[36px] items-center px-4 py-1.5 text-sm italic text-ink-muted opacity-40">
      {tUnit(dayMode, 'pastFoldLabel', 'pastFoldLabelDays', { n: count })}
    </li>
  );
}

/** Dezente Kopfzeile am Beginn der größten Lücke — erscheint genau einmal (P1). */
function GapRangeHeader({ count, dayMode }: { count: number; dayMode: boolean }) {
  return (
    <li className="flex items-center gap-2 border-s-2 border-gold py-1 ps-3 text-xs font-medium text-ink-muted">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
      {tUnit(dayMode, 'gapRangeHeader', 'gapRangeHeaderDays', { n: count })}
    </li>
  );
}

export function SlotList({
  days,
  projectTz,
  onBook,
  onOpenSheet,
  gapStartTime = null,
  gapCount = 0,
  dayMode = false,
}: SlotListProps) {
  const renderRow = (slot: SlotViewModel) => (
    <>
      {isGapStart(slot, gapStartTime) && <GapRangeHeader key={`gap-${slot.key}`} count={gapCount} dayMode={dayMode} />}
      <SlotRow
        key={slot.key}
        slot={slot}
        projectTz={projectTz}
        onBook={() => onBook(slot)}
        onOpen={() => onOpenSheet(slot)}
        dayMode={dayMode}
      />
    </>
  );

  if (dayMode) {
    // Wochen-Zwischenüberschriften nur, wenn die Wache mehr als eine Woche (>7 Tage) läuft (P3).
    const showWeekHeaders = days.length > 1;
    return (
      <div className="space-y-5">
        {days.map((week) => {
          const collapse = dayCollapseState(week.slots);
          const containsGapStart = week.slots.some((s) => isGapStart(s, gapStartTime));

          if (showWeekHeaders && collapse === 'all-past') {
            return (
              <ul key={week.key}>
                <PastFoldRow count={week.slots.length} dayMode />
              </ul>
            );
          }

          const booked = week.slots.filter((s) => s.status === 'BOOKED').length;
          const weekOf = t('weekOfLabel', { date: formatDateShort(week.slots[0].startTime, projectTz) });

          if (showWeekHeaders && collapse === 'future-free') {
            let header = t('weekFutureFreeHeader', { week: weekOf, n: week.slots.length });
            if (containsGapStart) header += ` · ${t('largestGapSuffix')}`;
            return (
              <DaySection
                key={week.key}
                dateLabel={weekOf}
                dayProgress={{ booked, total: week.slots.length }}
                defaultCollapsed
                headerOverride={header}
              >
                {week.slots.map(renderRow)}
              </DaySection>
            );
          }

          const leadingPast = leadingPastCount(week.slots);
          const rest = week.slots.slice(leadingPast);

          if (!showWeekHeaders) {
            // Wache passt in eine Woche — flache Liste ohne Wochen-Überschrift.
            return (
              <ul key={week.key} className="space-y-1.5">
                {leadingPast > 0 && <PastFoldRow key={`past-${week.key}`} count={leadingPast} dayMode />}
                {rest.map(renderRow)}
              </ul>
            );
          }

          return (
            <DaySection key={week.key} dateLabel={weekOf} dayProgress={{ booked, total: week.slots.length }}>
              {leadingPast > 0 && <PastFoldRow key={`past-${week.key}`} count={leadingPast} dayMode />}
              {rest.map(renderRow)}
            </DaySection>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {days.map((day) => {
        const collapse = dayCollapseState(day.slots);

        // Komplett vergangener Tag → eine Ghost-Zeile statt der ganzen Sektion.
        if (collapse === 'all-past') {
          return (
            <ul key={day.key}>
              <PastFoldRow count={day.slots.length} dayMode={false} />
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
            {leadingPast > 0 && <PastFoldRow key={`past-${day.key}`} count={leadingPast} dayMode={false} />}
            {rest.map(renderRow)}
          </DaySection>
        );
      })}
    </div>
  );
}
