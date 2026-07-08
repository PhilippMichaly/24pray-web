import { describe, it, expect } from 'vitest';
import {
  deriveSlotState,
  computeLargestGap,
  buildViewModels,
  cancelAbility,
  isGapStart,
  dayCollapseState,
  leadingPastCount,
  coverageByHour,
  isDayMode,
  groupByWeek,
  displayUnits,
} from './logic';
import type { SlotView } from '@/types';
import type { DerivationContext, SlotViewModel } from './types';

const TZ = 'UTC';
// Fester „now": 2026-07-06T05:30Z → laufende Stunde = 05:00–06:00
const NOW = Date.parse('2026-07-06T05:30:00.000Z');

function slot(hour: number, over: Partial<SlotView> = {}): SlotView {
  const h = String(hour).padStart(2, '0');
  return {
    slotId: over.status === 'BOOKED' ? `id-${hour}` : null,
    startTime: `2026-07-06T${h}:00:00.000Z`,
    endTime: `2026-07-06T${String(hour + 1).padStart(2, '0')}:00:00.000Z`,
    status: 'FREE',
    isMine: false,
    userName: null,
    ...over,
  };
}

const ctx = (over: Partial<DerivationContext> = {}): DerivationContext => ({
  now: NOW,
  projectTz: TZ,
  largestGapKeys: new Set(),
  pendingKeys: new Set(),
  conflictKey: null,
  ...over,
});

describe('deriveSlotState — Zustands-Matrix (§3.2)', () => {
  it('PAST für vergangene Stunde', () => {
    expect(deriveSlotState(slot(3), ctx())).toBe('PAST');
  });
  it('NOW_FREE für die laufende, freie Stunde', () => {
    expect(deriveSlotState(slot(5), ctx())).toBe('NOW_FREE');
  });
  it('NOW_MINE für laufende, eigene Stunde', () => {
    expect(deriveSlotState(slot(5, { status: 'BOOKED', isMine: true }), ctx())).toBe('NOW_MINE');
  });
  it('NOW_BOOKED für laufende, fremde Stunde', () => {
    expect(deriveSlotState(slot(5, { status: 'BOOKED' }), ctx())).toBe('NOW_BOOKED');
  });
  it('FREE / BOOKED / MINE für zukünftige Stunden', () => {
    expect(deriveSlotState(slot(10), ctx())).toBe('FREE');
    expect(deriveSlotState(slot(10, { status: 'BOOKED' }), ctx())).toBe('BOOKED');
    expect(deriveSlotState(slot(10, { status: 'BOOKED', isMine: true }), ctx())).toBe('MINE');
  });
  it('PENDING und CONFLICT haben Vorrang', () => {
    const key = slot(10).startTime;
    expect(deriveSlotState(slot(10), ctx({ pendingKeys: new Set([key]) }))).toBe('PENDING');
    expect(deriveSlotState(slot(10), ctx({ conflictKey: key }))).toBe('CONFLICT');
  });
  it('FREE_LARGEST_GAP wenn Teil der größten Lücke', () => {
    const key = slot(10).startTime;
    expect(deriveSlotState(slot(10), ctx({ largestGapKeys: new Set([key]) }))).toBe(
      'FREE_LARGEST_GAP',
    );
  });
});

describe('computeLargestGap', () => {
  it('findet den längsten Zukunfts-FREE-Lauf und baut ein Label', () => {
    const slots = [
      slot(6, { status: 'BOOKED' }),
      slot(7), // free
      slot(8, { status: 'BOOKED' }),
      slot(9), // free
      slot(10), // free
      slot(11), // free  ← größte Lücke 09–12
      slot(12, { status: 'BOOKED' }),
    ];
    const gap = computeLargestGap(slots, NOW, TZ);
    expect(gap.keys.size).toBe(3);
    expect(gap.startTime).toBe('2026-07-06T09:00:00.000Z');
    expect(gap.label).toContain('09–12');
  });
  it('ignoriert vergangene freie Slots', () => {
    const gap = computeLargestGap([slot(3), slot(4)], NOW, TZ);
    expect(gap.keys.size).toBe(0);
  });
});

describe('buildViewModels', () => {
  it('setzt Nacht-Flag + Lücken-Flag + Zustand konsistent', () => {
    const slots = [slot(2), slot(10), slot(11)];
    const { models } = buildViewModels(slots, {
      now: NOW,
      projectTz: TZ,
      pendingKeys: new Set(),
      conflictKey: null,
    });
    expect(models[0].isNight).toBe(true); // 02h
    expect(models[1].isNight).toBe(false); // 10h
    // 10+11 sind der größte Lauf → FREE_LARGEST_GAP
    expect(models[1].state).toBe('FREE_LARGEST_GAP');
  });
});

describe('cancelAbility — wer darf einen fremden/Gast-Slot stornieren (F2)', () => {
  const booked = { slotId: 'id-1', state: 'BOOKED' as const };

  it('Gast mit gespeichertem Token darf seinen gebuchten Slot stornieren', () => {
    expect(cancelAbility(booked, { isOrganizer: false, hasGuestToken: true })).toBe('guest');
  });

  it('Organisator darf fremde/Gast-Buchungen stornieren (auch die laufende Stunde)', () => {
    expect(cancelAbility(booked, { isOrganizer: true, hasGuestToken: false })).toBe('organizer');
    expect(cancelAbility({ slotId: 'id-1', state: 'NOW_BOOKED' }, { isOrganizer: true, hasGuestToken: false })).toBe('organizer');
  });

  it('sonst niemand', () => {
    expect(cancelAbility(booked, { isOrganizer: false, hasGuestToken: false })).toBe(null);
  });

  it('nicht für freie, vergangene oder eigene Slots (eigene laufen über den mine-Modus)', () => {
    expect(cancelAbility({ slotId: null, state: 'FREE' }, { isOrganizer: true, hasGuestToken: true })).toBe(null);
    expect(cancelAbility({ slotId: 'id-1', state: 'PAST' }, { isOrganizer: true, hasGuestToken: true })).toBe(null);
    expect(cancelAbility({ slotId: 'id-1', state: 'MINE' }, { isOrganizer: true, hasGuestToken: true })).toBe(null);
    expect(cancelAbility({ slotId: 'id-1', state: 'NOW_MINE' }, { isOrganizer: true, hasGuestToken: true })).toBe(null);
  });
});

describe('isGapStart — Lücken-Kopfzeile erscheint genau einmal (P1)', () => {
  it('ist true für genau den allerersten Slot der größten Lücke', () => {
    const slots = [
      slot(6, { status: 'BOOKED' }),
      slot(7), // free
      slot(8, { status: 'BOOKED' }),
      slot(9), // free ← Lückenstart
      slot(10), // free
      slot(11), // free ← größte Lücke 09–12
      slot(12, { status: 'BOOKED' }),
    ];
    const { models, gap } = buildViewModels(slots, {
      now: NOW,
      projectTz: TZ,
      pendingKeys: new Set(),
      conflictKey: null,
    });
    const flags = models.map((m) => isGapStart(m, gap.startTime));
    expect(flags.filter(Boolean)).toHaveLength(1);
    expect(models[flags.indexOf(true)].startTime).toBe('2026-07-06T09:00:00.000Z');
  });

  it('ist false, wenn es keine Lücke gibt (startTime null)', () => {
    const m = { isLargestGap: true, startTime: '2026-07-06T09:00:00.000Z' } as never;
    expect(isGapStart(m, null)).toBe(false);
  });

  it('ist false für alle anderen Slots der Lücke (nicht der Start)', () => {
    const slots = [slot(9), slot(10), slot(11)];
    const { models, gap } = buildViewModels(slots, {
      now: NOW,
      projectTz: TZ,
      pendingKeys: new Set(),
      conflictKey: null,
    });
    expect(isGapStart(models[1], gap.startTime)).toBe(false);
    expect(isGapStart(models[2], gap.startTime)).toBe(false);
  });
});

describe('dayCollapseState — Kollaps-Zustand eines Tages (P2)', () => {
  it('all-past, wenn jeder Slot PAST ist', () => {
    const slots = [slot(1), slot(2), slot(3)];
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(dayCollapseState(models)).toBe('all-past');
  });

  it('future-free, wenn alle Slots zukünftig UND frei sind', () => {
    const slots = [slot(10), slot(11), slot(12)];
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(dayCollapseState(models)).toBe('future-free');
  });

  it('normal, wenn Vergangenheit/laufende Stunde/Buchung mit Zukunft gemischt ist', () => {
    const slots = [slot(3), slot(5), slot(10, { status: 'BOOKED' })];
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(dayCollapseState(models)).toBe('normal');
  });

  it('normal für einen leeren Tag (keine Slots)', () => {
    expect(dayCollapseState([])).toBe('normal');
  });
});

describe('leadingPastCount — führende vergangene Slots zu einer Ghost-Zeile falten (P2)', () => {
  it('zählt nur die führenden PAST-Slots, stoppt beim ersten Nicht-PAST', () => {
    const slots = [slot(1), slot(2), slot(3), slot(5), slot(10)]; // 1–3 PAST, 5 NOW, 10 FREE
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(leadingPastCount(models)).toBe(3);
  });

  it('0, wenn der erste Slot bereits nicht PAST ist', () => {
    const slots = [slot(10), slot(1)];
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(leadingPastCount(models)).toBe(0);
  });

  it('= Gesamtlänge, wenn der ganze Tag vorüber ist', () => {
    const slots = [slot(1), slot(2)];
    const { models } = buildViewModels(slots, { now: NOW, projectTz: TZ, pendingKeys: new Set(), conflictKey: null });
    expect(leadingPastCount(models)).toBe(2);
  });
});

describe('coverageByHour — Tagesstunden-Abdeckung für die „Wache über den Tag"-Statistik', () => {
  function m(startISO: string, status: 'FREE' | 'BOOKED') {
    return { startTime: startISO, status };
  }

  it('liefert ein 24-Element-Array', () => {
    expect(coverageByHour([], 'UTC')).toHaveLength(24);
  });

  it('alle Buckets 0 ohne Slots', () => {
    expect(coverageByHour([], 'UTC')).toEqual(new Array(24).fill(0));
  });

  it('zählt nur BOOKED, ignoriert FREE', () => {
    const models = [m('2026-07-06T05:00:00.000Z', 'BOOKED'), m('2026-07-06T06:00:00.000Z', 'FREE')];
    const result = coverageByHour(models, 'UTC');
    expect(result[5]).toBe(1);
    expect(result[6]).toBe(0);
  });

  it('summiert dieselbe Tagesstunde über mehrere Kalendertage', () => {
    const models = [
      m('2026-07-06T14:00:00.000Z', 'BOOKED'),
      m('2026-07-07T14:00:00.000Z', 'BOOKED'),
      m('2026-07-08T14:00:00.000Z', 'BOOKED'),
    ];
    const result = coverageByHour(models, 'UTC');
    expect(result[14]).toBe(3);
    expect(result.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('bucketet nach Projekt-Zeitzone, nicht nach UTC', () => {
    // 02:00 UTC ist im Sommer 04:00 in Europe/Berlin (UTC+2)
    const models = [m('2026-07-06T02:00:00.000Z', 'BOOKED')];
    expect(coverageByHour(models, 'Europe/Berlin')[4]).toBe(1);
    expect(coverageByHour(models, 'Europe/Berlin')[2]).toBe(0);
  });

  it('zählt vergangene (gehaltene) und zukünftige Buchungen gleichermaßen (BOOKED+COMPLETED)', () => {
    // Slot in der Vergangenheit — status bleibt BOOKED unabhängig vom abgeleiteten PAST-State.
    const models = [m('2020-01-01T09:00:00.000Z', 'BOOKED')];
    expect(coverageByHour(models, 'UTC')[9]).toBe(1);
  });
});

describe('isDayMode — Tages-Wache vs. Stunden-Wache (slotDurationMinutes)', () => {
  it('true nur für 1440 (ganzer Tag)', () => {
    expect(isDayMode(1440)).toBe(true);
  });
  it('false für Stunden-Slots (60) und jeden anderen Wert', () => {
    expect(isDayMode(60)).toBe(false);
    expect(isDayMode(30)).toBe(false);
  });
});

describe('groupByWeek — Wochen-Chunking für Tages-Modus-Zwischenüberschriften', () => {
  function daySlot(dayOffset: number): SlotViewModel {
    const start = new Date(Date.UTC(2026, 6, 1 + dayOffset)).toISOString();
    const end = new Date(Date.UTC(2026, 6, 2 + dayOffset)).toISOString();
    return {
      key: start,
      slotId: null,
      startTime: start,
      endTime: end,
      isMine: false,
      userName: null,
      status: 'FREE',
      isNight: false,
      isLargestGap: false,
      state: 'FREE',
    };
  }

  it('chunkt in Blöcke von 7 Tagen, key = erster Slot des Blocks', () => {
    const models = Array.from({ length: 10 }, (_, i) => daySlot(i));
    const weeks = groupByWeek(models);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].slots).toHaveLength(7);
    expect(weeks[1].slots).toHaveLength(3);
    expect(weeks[0].key).toBe(models[0].startTime);
    expect(weeks[1].key).toBe(models[7].startTime);
  });

  it('ein einzelner Block bei <=7 Tagen', () => {
    const models = Array.from({ length: 5 }, (_, i) => daySlot(i));
    expect(groupByWeek(models)).toHaveLength(1);
  });

  it('leer bei leerer Liste', () => {
    expect(groupByWeek([])).toHaveLength(0);
  });
});

describe('displayUnits — Personen-Tabelle Stunden vs. Tage', () => {
  it('gibt Stunden unverändert zurück, wenn nicht im Tages-Modus', () => {
    expect(displayUnits(48, false)).toBe(48);
  });
  it('rechnet Stunden in Tage um (÷24), im Tages-Modus', () => {
    expect(displayUnits(48, true)).toBe(2);
    expect(displayUnits(36, true)).toBe(1.5);
  });
});

describe('computeLargestGap — Tages-Modus-Label (Datum statt Uhrzeit)', () => {
  function daySlot(dayOffset: number, over: Partial<SlotView> = {}): SlotView {
    const start = new Date(Date.UTC(2026, 6, 1 + dayOffset)).toISOString();
    const end = new Date(Date.UTC(2026, 6, 2 + dayOffset)).toISOString();
    return { slotId: null, startTime: start, endTime: end, status: 'FREE', isMine: false, userName: null, ...over };
  }

  it('baut ein Datums-Label (kein Stunden-Bereich) für einen Ein-Tages-Lauf', () => {
    const now = Date.parse('2026-06-25T00:00:00.000Z'); // vor der ganzen Wache
    const slots = [daySlot(0, { status: 'BOOKED' }), daySlot(1), daySlot(2, { status: 'BOOKED' })];
    const gap = computeLargestGap(slots, now, 'UTC', true);
    expect(gap.keys.size).toBe(1);
    expect(gap.label).not.toMatch(/\d{2}–\d{2}/); // kein Stunden-Bereich
    expect(gap.label).toMatch(/\d/); // enthält ein Datum
  });

  it('baut ein Datums-Bereichs-Label für einen Mehr-Tages-Lauf', () => {
    const now = Date.parse('2026-06-25T00:00:00.000Z');
    const slots = [daySlot(0, { status: 'BOOKED' }), daySlot(1), daySlot(2), daySlot(3, { status: 'BOOKED' })];
    const gap = computeLargestGap(slots, now, 'UTC', true);
    expect(gap.keys.size).toBe(2);
    expect(gap.label).toContain('–');
  });
});
