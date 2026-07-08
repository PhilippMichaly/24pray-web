// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Ruth Klein', email: 'ruth@example.com' }, loading: false }),
}));

import { AppShell } from './AppShell';

describe('AppShell — wb-Profil-Link im UserMenu', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('Avatar + Name sind klickbar und führen zu /profil', () => {
    render(<AppShell>Inhalt</AppShell>);
    const link = screen.getByRole('link', { name: /Ruth Klein/i });
    expect(link.getAttribute('href')).toBe('/profil');
  });
});
