// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(async () => null), post: vi.fn(async () => ({})) } }));

import ImpressumPage from './impressum/page';
import DatenschutzPage from './datenschutz/page';
import LoginPage from './auth/login/page';

describe('Rechtliches (Impressum/Datenschutz, DSGVO-Hinweise)', () => {
  beforeEach(() => cleanup());

  it('Impressum-Seite rendert mit Anbieterkennzeichnung', () => {
    render(<ImpressumPage />);
    expect(screen.getByRole('heading', { name: 'Impressum' })).toBeTruthy();
    expect(screen.getByText(/Angaben gemäß § 5 DDG/i)).toBeTruthy();
  });

  it('Datenschutz-Seite rendert mit Art.-9-Abschnitt und Cookie-Aussage', () => {
    render(<DatenschutzPage />);
    expect(screen.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeTruthy();
    expect(screen.getAllByText(/Art\. 9 DSGVO/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/technisch notwendig/i).length).toBeGreaterThan(0);
  });

  it('Login zeigt den Einwilligungshinweis mit Link zur Datenschutzerklärung', () => {
    render(<LoginPage />);
    expect(screen.getByText(/willigst du ein/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /Datenschutzerklärung/i });
    expect(link.getAttribute('href')).toBe('/datenschutz');
  });
});
