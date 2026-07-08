'use client';

import { formatDayHeader } from '@/lib/time';
import { SlotRow } from './SlotRow';
import { DaySection } from './DaySection';
import type { SlotViewModel } from './types';

export interface SlotListProps {
  days: { key: string; slots: SlotViewModel[] }[];
  projectTz: string;
  onBook: (slot: SlotViewModel) => void;
  onOpenSheet: (slot: SlotViewModel) => void;
}

export function SlotList({ days, projectTz, onBook, onOpenSheet }: SlotListProps) {
  return (
    <div className="space-y-5">
      {days.map((day) => {
        const booked = day.slots.filter((s) => s.status === 'BOOKED').length;
        // Tag ist komplett vergangen → eingeklappt.
        const allPast = day.slots.every((s) => s.state === 'PAST');
        return (
          <DaySection
            key={day.key}
            dateLabel={formatDayHeader(day.slots[0].startTime, projectTz)}
            dayProgress={{ booked, total: day.slots.length }}
            defaultCollapsed={allPast}
          >
            {day.slots.map((slot) => (
              <SlotRow
                key={slot.key}
                slot={slot}
                projectTz={projectTz}
                onBook={() => onBook(slot)}
                onOpen={() => onOpenSheet(slot)}
              />
            ))}
          </DaySection>
        );
      })}
    </div>
  );
}
