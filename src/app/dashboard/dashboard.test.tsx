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
  api: { get: vi.fn(async () => [publicProject]) },
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

  it('Sprach-Filter zeigt nur Wachen der gewählten Sprache (Backlog 5)', async () => {
    const deProject = {
      id: 'p-de',
      title: 'un5 Deutsche Wache',
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      timezone: 'UTC',
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-02T00:00:00.000Z',
      totalSlots: 24,
      bookedSlots: 3,
      language: 'de',
    } as ProjectWithStats;
    const esProject = {
      id: 'p-es',
      title: 'un5 Vigilia Española',
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      timezone: 'UTC',
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-02T00:00:00.000Z',
      totalSlots: 24,
      bookedSlots: 3,
      language: 'es',
    } as ProjectWithStats;
    const { api } = await import('@/lib/api');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([deProject, esProject]);

    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('un5 Deutsche Wache')).toBeTruthy());
    expect(screen.getByText('un5 Vigilia Española')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: /Sprache|language/i }), { target: { value: 'es' } });
    expect(screen.queryByText('un5 Deutsche Wache')).toBeNull();
    expect(screen.getByText('un5 Vigilia Española')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: /Sprache|language/i }), { target: { value: 'all' } });
    expect(screen.getByText('un5 Deutsche Wache')).toBeTruthy();
  });
});
