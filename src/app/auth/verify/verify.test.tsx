// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const push = vi.fn();
let search = '?token=abc123';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/auth/verify',
  useSearchParams: () => new URLSearchParams(search),
}));
const post = vi.fn();
vi.mock('@/lib/api', () => ({ api: { post: (...a: unknown[]) => post(...a) } }));
let auth: { user: { email: string } | null; loading: boolean; isLoggedIn: boolean } = {
  user: null,
  loading: false,
  isLoggedIn: false,
};
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => auth }));

import VerifyPage from './page';

describe('Login-Link wird erst nach Klick eingelöst', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    search = '?token=abc123';
    auth = { user: null, loading: false, isLoggedIn: false };
    window.history.replaceState(null, '', '/auth/verify?token=abc123');
  });

  it('sendet beim Rendern kein POST, erst der Klick sendet den Token; URL danach ohne Query', async () => {
    post.mockResolvedValueOnce({});
    render(<VerifyPage />);
    expect(post).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Jetzt anmelden' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/verify', { token: 'abc123' }));
    expect(post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'), { timeout: 3000 });
  });

  it('Token geht nach replaceState nicht verloren, auch wenn useSearchParams leer wird', async () => {
    post.mockResolvedValueOnce({});
    const { rerender } = render(<VerifyPage />);
    search = '';
    rerender(<VerifyPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt anmelden' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/verify', { token: 'abc123' }));
  });

  it('ohne Token: Unvollständig-Meldung statt Abgelaufen-Meldung, kein POST', () => {
    search = '';
    render(<VerifyPage />);
    expect(screen.getByText(/Link ist unvollständig/)).toBeTruthy();
    expect(screen.getByText(/6-stelligen Code/)).toBeTruthy();
    expect(screen.queryByText(/abgelaufen/)).toBeNull();
    expect(screen.getByRole('link', { name: /neuen Link/i })).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('API-Fehler nach Klick: Fehlerzustand', async () => {
    post.mockRejectedValueOnce(new Error('x'));
    render(<VerifyPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt anmelden' }));
    await waitFor(() => expect(screen.getByText("Link ungültig")).toBeTruthy());
  });

  it('bereits eingeloggt: Hinweis mit E-Mail über dem Button', () => {
    auth = { user: { email: 'ich@example.com' }, loading: false, isLoggedIn: true };
    render(<VerifyPage />);
    expect(screen.getByText(/bereits als ich@example\.com angemeldet/)).toBeTruthy();
  });

  it('Auth lädt noch: kein Hinweis', () => {
    auth = { user: null, loading: true, isLoggedIn: false };
    render(<VerifyPage />);
    expect(screen.queryByText(/bereits als/)).toBeNull();
  });
});
