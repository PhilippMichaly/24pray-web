// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/profil',
  useSearchParams: () => new URLSearchParams(),
}));

const user = { id: 'u1', name: 'Ruth Klein', email: 'ruth@example.com', role: 'MEMBER', createdAt: '2026-01-01T00:00:00.000Z' };
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user, loading: false }),
}));

const patch = vi.fn();
const del = vi.fn();
vi.mock('@/lib/api', () => ({
  updateMe: (name: string) => patch('/me', { name }),
  deleteMe: () => del('/me'),
}));

import ProfilePage from './page';

describe('Profil-Seite — wb-Name ändern + wb-Konto löschen', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('zeigt den aktuellen Namen vorbefüllt und speichert eine Änderung per PATCH /me', async () => {
    patch.mockResolvedValueOnce({ ...user, name: 'Ruth K. Neu' });
    render(<ProfilePage />);

    const input = screen.getByLabelText(/Anzeigename/i) as HTMLInputElement;
    expect(input.value).toBe('Ruth Klein');

    fireEvent.change(input, { target: { value: 'Ruth K. Neu' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/i }));

    await waitFor(() => expect(patch).toHaveBeenCalledWith('/me', { name: 'Ruth K. Neu' }));
  });

  it('Danger-Zone: Bestätigung nennt Konsequenzen, Bestätigen ruft DELETE /me und leitet auf / weiter', async () => {
    del.mockResolvedValueOnce(undefined);
    render(<ProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: /Konto löschen/i }));
    await waitFor(() => expect(screen.getByText(/rückgängig gemacht werden|cannot be undone/i)).toBeTruthy());
    expect(screen.getByText(/eigenen Ketten|own chains/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /endgültig löschen|permanently delete/i }));

    await waitFor(() => expect(del).toHaveBeenCalledWith('/me'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });
});
