// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SlotList } from './SlotList';
import type { SlotViewModel } from './types';

function m(startTime: string, endTime: string, state: SlotViewModel['state'], over: Partial<SlotViewModel> = {}): SlotViewModel {
  return {
    key: startTime,
    slotId: state === 'BOOKED' || state === 'NOW_BOOKED' ? `id-${startTime}` : null,
    startTime,
    endTime,
    isMine: false,
    userName: null,
    status: state === 'BOOKED' || state === 'NOW_BOOKED' ? 'BOOKED' : 'FREE',
    isNight: false,
    isLargestGap: state === 'FREE_LARGEST_GAP',
    state,
    ...over,
  };
}

// Tag 1 (01.07): komplett vorüber.
const day1 = [
  m('2026-07-01T03:00:00.000Z', '2026-07-01T04:00:00.000Z', 'PAST'),
  m('2026-07-01T04:00:00.000Z', '2026-07-01T05:00:00.000Z', 'PAST'),
];

// Tag 2 (02.07): 3 führende PAST-Slots, dann NOW, dann die größte Lücke (2 Slots).
const day2 = [
  m('2026-07-02T00:00:00.000Z', '2026-07-02T01:00:00.000Z', 'PAST'),
  m('2026-07-02T01:00:00.000Z', '2026-07-02T02:00:00.000Z', 'PAST'),
  m('2026-07-02T02:00:00.000Z', '2026-07-02T03:00:00.000Z', 'PAST'),
  m('2026-07-02T05:00:00.000Z', '2026-07-02T06:00:00.000Z', 'NOW_FREE'),
  m('2026-07-02T09:00:00.000Z', '2026-07-02T10:00:00.000Z', 'FREE_LARGEST_GAP'),
  m('2026-07-02T10:00:00.000Z', '2026-07-02T11:00:00.000Z', 'FREE_LARGEST_GAP'),
];

// Tag 3 (03.07): komplett zukünftig + frei.
const day3 = [
  m('2026-07-03T10:00:00.000Z', '2026-07-03T11:00:00.000Z', 'FREE_LARGEST_GAP'),
  m('2026-07-03T11:00:00.000Z', '2026-07-03T12:00:00.000Z', 'FREE_LARGEST_GAP'),
];

const days = [
  { key: '2026-07-01', slots: day1 },
  { key: '2026-07-02', slots: day2 },
  { key: '2026-07-03', slots: day3 },
];

describe('SlotList — Lücken-Header + Tages-Kollaps (P1/P2)', () => {
  afterEach(() => cleanup());

  it('rendert die Lücken-Kopfzeile genau einmal, direkt vor dem ersten Gap-Slot', () => {
    render(
      <SlotList
        days={days}
        projectTz="UTC"
        onBook={() => {}}
        onOpenSheet={() => {}}
        gapStartTime="2026-07-02T09:00:00.000Z"
        gapCount={2}
      />,
    );
    expect(screen.getAllByText(/Größte Lücke: 2 Stunden am Stück/)).toHaveLength(1);
  });

  it('komplett vergangener Tag wird zu einer Ghost-Zeile ohne Sektion/Chevron-Button', () => {
    render(<SlotList days={days} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} />);
    expect(screen.getByText('2 Stunden vorüber')).toBeTruthy();
  });

  it('führende PAST-Slots eines normalen Tages falten zu einer eigenen Ghost-Zeile, Rest bleibt sichtbar', () => {
    render(<SlotList days={days} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} />);
    // Tag 2 hat 3 führende PAST-Slots → eigene Fold-Zeile, unterscheidbar von Tag 1s "2 Stunden vorüber".
    expect(screen.getByText('3 Stunden vorüber')).toBeTruthy();
  });

  it('komplett zukünftiger/freier Tag startet eingeklappt mit einladender Kopfzeile', () => {
    render(<SlotList days={days} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} />);
    const header = screen.getByText(/noch ganz frei · 2 Stunden zu vergeben/);
    expect(header).toBeTruthy();
    const button = header.closest('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('hängt "· größte Lücke" an die kollabierte Kopfzeile, wenn der Gap-Start in diesem Tag liegt', () => {
    const daysWithGapOnFutureFreeDay = [
      { key: '2026-07-03', slots: day3 },
    ];
    render(
      <SlotList
        days={daysWithGapOnFutureFreeDay}
        projectTz="UTC"
        onBook={() => {}}
        onOpenSheet={() => {}}
        gapStartTime="2026-07-03T10:00:00.000Z"
        gapCount={2}
      />,
    );
    expect(screen.getByText(/noch ganz frei · 2 Stunden zu vergeben · größte Lücke/)).toBeTruthy();
  });
});

describe('SlotList — Tages-Modus (dayMode, P3): Wochen-Zwischenüberschriften + Tages-Zeilen', () => {
  afterEach(() => cleanup());

  function daySlot(dayOffset: number, state: SlotViewModel['state']): SlotViewModel {
    const start = new Date(Date.UTC(2026, 6, 1 + dayOffset, 14, 0, 0)).toISOString();
    const end = new Date(Date.UTC(2026, 6, 2 + dayOffset, 14, 0, 0)).toISOString();
    return {
      key: start,
      slotId: state === 'BOOKED' ? `id-${dayOffset}` : null,
      startTime: start,
      endTime: end,
      isMine: false,
      userName: null,
      status: state === 'BOOKED' ? 'BOOKED' : 'FREE',
      isNight: false,
      isLargestGap: state === 'FREE_LARGEST_GAP',
      state,
    };
  }

  // Woche 1: 3 führende PAST-Tage, dann 4 gemischte (Buchung + freie inkl. größte Lücke).
  const week1 = [
    daySlot(0, 'PAST'),
    daySlot(1, 'PAST'),
    daySlot(2, 'PAST'),
    daySlot(3, 'BOOKED'),
    daySlot(4, 'FREE_LARGEST_GAP'),
    daySlot(5, 'FREE_LARGEST_GAP'),
    daySlot(6, 'BOOKED'),
  ];
  // Woche 2: komplett zukünftig + frei.
  const week2 = [daySlot(7, 'FREE'), daySlot(8, 'FREE'), daySlot(9, 'FREE')];

  const weeks = [
    { key: week1[0].startTime, slots: week1 },
    { key: week2[0].startTime, slots: week2 },
  ];

  it('zeigt Wochen-Kopfzeilen ("Woche vom …"), wenn die Wache >7 Tage läuft', () => {
    render(<SlotList days={weeks} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} dayMode />);
    expect(screen.getAllByText(/^Woche vom/).length).toBeGreaterThan(0);
  });

  it('faltet führende vergangene Tage zu "{n} Tage vorüber" statt Stunden-Text', () => {
    render(<SlotList days={weeks} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} dayMode />);
    expect(screen.getByText('3 Tage vorüber')).toBeTruthy();
  });

  it('komplett freie Woche kollabiert mit "Tage zu vergeben" statt "Stunden zu vergeben"', () => {
    render(<SlotList days={weeks} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} dayMode />);
    expect(screen.getByText(/noch ganz frei · 3 Tage zu vergeben/)).toBeTruthy();
  });

  it('Gap-Header zeigt "Tage am Stück" statt "Stunden am Stück"', () => {
    render(
      <SlotList
        days={weeks}
        projectTz="UTC"
        onBook={() => {}}
        onOpenSheet={() => {}}
        dayMode
        gapStartTime={week1[4].startTime}
        gapCount={2}
      />,
    );
    expect(screen.getByText(/Größte Lücke: 2 Tage am Stück/)).toBeTruthy();
  });

  it('Tages-Zeilen zeigen keinen Stunden-Bereich (kein "HH–HH")', () => {
    render(<SlotList days={weeks} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} dayMode />);
    expect(screen.queryByText(/\d{2}–\d{2}/)).toBeNull();
  });

  it('ohne Wochen-Header (≤7 Tage gesamt): flache Liste, keine "Woche vom"-Zeile', () => {
    const single = [{ key: week2[0].startTime, slots: week2 }];
    render(<SlotList days={single} projectTz="UTC" onBook={() => {}} onOpenSheet={() => {}} dayMode />);
    expect(screen.queryByText(/^Woche vom/)).toBeNull();
  });
});
