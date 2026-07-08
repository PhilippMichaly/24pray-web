// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/auth/login',
  useSearchParams: () => new URLSearchParams(),
}));
const post = vi.fn();
vi.mock('@/lib/api', () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import LoginPage from './page';

describe('Login mit 6-stelligem Code (Alternative zum Link)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('nach dem Senden: Code-Eingabe sichtbar, Code-Submit ruft /auth/verify-code und leitet weiter', async () => {
    post.mockResolvedValueOnce({}); // magic-link (Produktion: 204, keine devLoginUrl)
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'ich@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Link senden|anmelden/i }));
    await waitFor(() => expect(screen.getByLabelText(/Code aus der E-Mail/i)).toBeTruthy());

    post.mockResolvedValueOnce({ id: 'u1', email: 'ich@example.com' }); // verify-code
    fireEvent.change(screen.getByLabelText(/Code aus der E-Mail/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Mit Code anmelden/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/auth/verify-code', { email: 'ich@example.com', code: '123456' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('falscher Code zeigt Fehlermeldung', async () => {
    post.mockResolvedValueOnce({});
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'ich@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Link senden|anmelden/i }));
    await waitFor(() => expect(screen.getByLabelText(/Code aus der E-Mail/i)).toBeTruthy());

    post.mockRejectedValueOnce(new Error('Code ungültig oder abgelaufen'));
    fireEvent.change(screen.getByLabelText(/Code aus der E-Mail/i), { target: { value: '999999' } });
    fireEvent.click(screen.getByRole('button', { name: /Mit Code anmelden/i }));
    await waitFor(() => expect(screen.getByText(/ungültig oder abgelaufen/i)).toBeTruthy());
  });
});
