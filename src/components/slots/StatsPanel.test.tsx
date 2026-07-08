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
    expect(screen.getByRole('region', { name: 'Gebetswache über den Tag' })).toBeTruthy();
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

describe('StatsPanel Tages-Modus (dayMode, P3) — Tage statt Stunden, kein Stunden-Chart', () => {
  beforeEach(() => cleanup());
  const models: SlotViewModel[] = [];

  it('Hero-Zahl rechnet Stunden in Tage um (÷24) + Label sagt "Tage gehalten"', async () => {
    // completedHours=7*24=168 -> 7 Tage
    const { getProjectStats } = await import('@/lib/api');
    vi.mocked(getProjectStats).mockResolvedValueOnce({
      completedHours: 168,
      perPerson: [{ name: 'Ruth Klein', hours: 96 }],
    });
    render(<StatsPanel projectId="p1" models={models} tz="UTC" dayMode />);
    await waitFor(() => expect(screen.getByText('7')).toBeTruthy());
    expect(screen.getByText('Tage gehalten')).toBeTruthy();
  });

  it('blendet den Stunden-Chart aus und zeigt "{n} Tage" in der Personen-Tabelle', async () => {
    const { getProjectStats } = await import('@/lib/api');
    vi.mocked(getProjectStats).mockResolvedValueOnce({
      completedHours: 168,
      perPerson: [{ name: 'Ruth Klein', hours: 96 }],
    });
    render(<StatsPanel projectId="p1" models={models} tz="UTC" dayMode />);
    await waitFor(() => expect(screen.getByText('Ruth Klein')).toBeTruthy());
    expect(screen.queryByRole('region', { name: /über den Tag/ })).toBeNull();
    expect(screen.getByText('4 Tage')).toBeTruthy(); // 96h / 24 = 4 Tage
  });

  it('Personen-Tabelle sagt "1 Tag" (Singular), nicht "1 Tage", bei genau 24h', async () => {
    const { getProjectStats } = await import('@/lib/api');
    vi.mocked(getProjectStats).mockResolvedValueOnce({
      completedHours: 24,
      perPerson: [{ name: 'Ruth Klein', hours: 24 }],
    });
    render(<StatsPanel projectId="p1" models={models} tz="UTC" dayMode />);
    await waitFor(() => expect(screen.getByText('Ruth Klein')).toBeTruthy());
    expect(screen.getByText('1 Tag')).toBeTruthy();
    expect(screen.queryByText('1 Tage')).toBeNull();
  });

  it('leerer Zustand sagt "Sobald Tage vorbei sind" statt "Sobald Stunden"', async () => {
    const { getProjectStats } = await import('@/lib/api');
    vi.mocked(getProjectStats).mockResolvedValueOnce({ completedHours: 0, perPerson: [] });
    render(<StatsPanel projectId="p1" models={[]} tz="UTC" dayMode />);
    await waitFor(() => expect(screen.getByText(/Sobald Tage vorbei sind/)).toBeTruthy());
  });
});
