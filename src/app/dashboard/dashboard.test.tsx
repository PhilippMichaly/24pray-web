// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import type { ProjectWithStats } from '@/types';

const publicProject = {
  id: 'p-pub',
  title: 'Offene Testkette',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  timezone: 'UTC',
  startDate: '2099-01-01T00:00:00.000Z',
  endDate: '2099-01-02T00:00:00.000Z',
  totalSlots: 24,
  bookedSlots: 3,
} as ProjectWithStats;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(async () => [publicProject]), post: vi.fn(async () => undefined) },
  getSlotGrid: vi.fn(async () => []),
}));

import DashboardPage from './page';

describe('Dashboard ohne Account (F4) — offene Ketten sofort sichtbar', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('zeigt anonymen Besuchern die öffentlichen Ketten statt einer Login-Wand', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Offene Testkette')).toBeTruthy());
    expect(screen.queryByText(/melde dich an/i)).toBeNull();
    expect(screen.getByText('Offene Gebetswachen')).toBeTruthy();
  });

  it('trennt laufende und beendete Wachen; Beendetes ist eingeklappt, solange es Laufendes gibt', async () => {
    const mk = (id: string, title: string, start: string, end: string) =>
      ({ id, title, status: 'ACTIVE', visibility: 'PUBLIC', timezone: 'UTC', startDate: start, endDate: end,
         totalSlots: 24, bookedSlots: 3, language: 'de' }) as ProjectWithStats;
    const { api } = await import('@/lib/api');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      mk('p-old', 'ux Alte Wache', '2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z'),
      mk('p-new', 'ux Kommende Wache', '2099-01-01T00:00:00.000Z', '2099-01-02T00:00:00.000Z'),
    ]);

    const { container } = render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('ux Kommende Wache')).toBeTruthy());
    expect(screen.getByText('Laufend und geplant')).toBeTruthy();
    expect(screen.getByText(/Abgeschlossen \(1\)/)).toBeTruthy();
    const details = container.querySelector('details');
    expect(details?.open).toBe(false);
    expect(details?.textContent).toContain('ux Alte Wache');
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
