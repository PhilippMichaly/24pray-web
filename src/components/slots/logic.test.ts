import { describe, it, expect } from 'vitest';
import { deriveSlotState, computeLargestGap, buildViewModels } from './logic';
import type { SlotView } from '@/types';
import type { DerivationContext } from './types';

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
