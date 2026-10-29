// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ProjectWithStats, SlotView } from '@/types';

// Steuerbares getSlotGrid: jeder Aufruf liefert ein Promise, das der Test manuell auflöst/ablehnt.
type Deferred = { projectId: string; resolve: (s: SlotView[]) => void; reject: (e: Error) => void };
const pending: Deferred[] = [];
const getSlotGrid = vi.fn(
  (projectId: string) =>
    new Promise<SlotView[]>((resolve, reject) => {
      pending.push({ projectId, resolve, reject });
    }),
);
vi.mock('@/lib/api', () => ({
  getSlotGrid: (id: string) => getSlotGrid(id),
  bookSlot: vi.fn(),
  cancelSlot: vi.fn(),
}));
vi.mock('@/components/ui/toast-store', () => ({ toast: vi.fn() }));

import { useSlotGrid, useSlotGridStore } from './store';

// DST-freie Januar-Daten, UTC.
const project = (id: string): ProjectWithStats =>
  ({
    id,
    title: id,
    timezone: 'UTC',
    slotDurationMinutes: 60,
    startDate: '2099-01-10T10:00:00.000Z',
    endDate: '2099-01-10T12:00:00.000Z',
    totalSlots: 2,
    bookedSlots: 1,
  }) as ProjectWithStats;

const slots = (prefix: string): SlotView[] => [
  {
    slotId: `${prefix}-1`,
    startTime: '2099-01-10T10:00:00.000Z',
    endTime: '2099-01-10T11:00:00.000Z',
    status: 'BOOKED',
    isMine: false,
    userName: 'A',
  },
  {
    slotId: null,
    startTime: '2099-01-10T11:00:00.000Z',
    endTime: '2099-01-10T12:00:00.000Z',
    status: 'FREE',
    isMine: false,
    userName: null,
  },
];

const A = project('A');
const B = project('B');

describe('useSlotGrid — loaded gilt nur für das Raster der aktuellen Wache (I-12, Pitfall 3)', () => {
  beforeEach(() => {
    pending.length = 0;
    getSlotGrid.mockClear();
    useSlotGridStore.setState({ slots: [], loadedFor: null, pendingKeys: new Set(), conflictKey: null });
  });

  it('Wache A: loaded false vor dem Auflösen von getSlotGrid, true danach', async () => {
    const { result } = renderHook(() => useSlotGrid(A, null));
    expect(result.current.loaded).toBe(false);
    expect(getSlotGrid).toHaveBeenCalledWith('A');
    await act(async () => pending[0].resolve(slots('A')));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.models).toHaveLength(2);
  });

  it('Wechsel auf Wache B mit offenem Request: loaded false trotz Slots von A im Store; nach Auflösen true', async () => {
    const { result, rerender } = renderHook(({ p }) => useSlotGrid(p, null), { initialProps: { p: A } });
    await act(async () => pending[0].resolve(slots('A')));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    rerender({ p: B });
    expect(getSlotGrid).toHaveBeenLastCalledWith('B');
    expect(useSlotGridStore.getState().slots[0].slotId).toBe('A-1'); // Altbestand von A
    expect(result.current.loaded).toBe(false);

    await act(async () => pending[1].resolve(slots('B')));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(useSlotGridStore.getState().loadedFor).toBe('B');
  });

  it('Fehler von getSlotGrid: loaded bleibt false, error ist gesetzt', async () => {
    const { result } = renderHook(() => useSlotGrid(A, null));
    await act(async () => pending[0].reject(new Error('Raster weg')));
    await waitFor(() => expect(result.current.error).toBe('Raster weg'));
    expect(result.current.loaded).toBe(false);
  });

  it('ohne Projekt: loaded false, kein Request', () => {
    const { result } = renderHook(() => useSlotGrid(null, null));
    expect(result.current.loaded).toBe(false);
    expect(getSlotGrid).not.toHaveBeenCalled();
  });
});
