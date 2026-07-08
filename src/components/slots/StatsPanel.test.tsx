// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import type { SlotViewModel } from './types';

vi.mock('@/lib/api', () => ({
  getProjectStats: vi.fn(async () => ({
    completedHours: 7,
    perPerson: [
      { name: 'Ruth Klein', hours: 4 },
      { name: 'Jonas Bär', hours: 3 },
    ],
  })),
}));

import { StatsPanel } from './StatsPanel';

function bookedModel(startTime: string): SlotViewModel {
  return {
    key: startTime,
    slotId: 's-1',
    startTime,
    endTime: startTime,
    isMine: false,
    userName: 'Ruth Klein',
    status: 'BOOKED',
    isNight: false,
    isLargestGap: false,
    state: 'PAST',
  };
}

describe('StatsPanel — Hero-Zahl + Tages-Abdeckung + Personen-Tabelle (dataviz-Skill)', () => {
  beforeEach(() => cleanup());

  const models = [
    bookedModel('2026-07-06T14:00:00.000Z'),
    bookedModel('2026-07-07T14:00:00.000Z'),
  ];

  it('zeigt die Hero-Zahl (completedHours) groß + Label', async () => {
    render(<StatsPanel projectId="p1" models={models} tz="UTC" />);
    await waitFor(() => expect(screen.getByText('7')).toBeTruthy());
    expect(screen.getByText(/Stunden gehalten/)).toBeTruthy();
  });

  it('zeigt „Wache über den Tag" mit einem Balken pro Person + Personen-Tabelle', async () => {
    render(<StatsPanel projectId="p1" models={models} tz="UTC" />);
    await waitFor(() => expect(screen.getByText('Ruth Klein')).toBeTruthy());
    expect(screen.getByRole('region', { name: 'Wache über den Tag' })).toBeTruthy();
    // 24 Stunden-Balken als fokussierbare Buttons mit direktem aria-label (keine Tooltip-Pflicht).
    expect(screen.getAllByRole('button', { name: /Uhr · \d+× gehalten/ })).toHaveLength(24);
    expect(screen.getByText('Jonas Bär')).toBeTruthy();
    expect(screen.getByText('4 h')).toBeTruthy();
    expect(screen.getByText('3 h')).toBeTruthy();
  });

  it('rendert eine echte Tabelle für „Wer trägt die Wache" (a11y)', async () => {
    render(<StatsPanel projectId="p1" models={models} tz="UTC" />);
    await waitFor(() => expect(screen.getByRole('table')).toBeTruthy());
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 Personen
  });

  it('leerer Zustand ohne Buchungen zeigt EmptyState statt Charts', async () => {
    const { getProjectStats } = await import('@/lib/api');
    vi.mocked(getProjectStats).mockResolvedValueOnce({ completedHours: 0, perPerson: [] });
    render(<StatsPanel projectId="p1" models={[]} tz="UTC" />);
    await waitFor(() => expect(screen.getByText(/Noch keine gehaltenen Stunden/)).toBeTruthy());
    expect(screen.queryByRole('table')).toBeNull();
  });
});
