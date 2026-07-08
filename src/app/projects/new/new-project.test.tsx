// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects/new',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Ruth' }, loading: false }),
}));

const post = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { post: (...a: unknown[]) => post(...a) },
  geocodeCity: vi.fn(async () => []),
}));

import NewProjectPage from './page';

describe('Neue Kette anlegen — wb-Owner-Benachrichtigung (Punkt 10)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  async function goToStep2() {
    render(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText(/^Titel/i), { target: { value: 'wb-Nachtgebet' } });
    fireEvent.click(screen.getByRole('button', { name: /Weiter/i }));
    await waitFor(() => expect(screen.getByLabelText(/Start/i)).toBeTruthy());
  }

  it('Checkbox ist standardmäßig aktiv und wird als notifyOnBooking:true mitgeschickt', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    const checkbox = screen.getByLabelText(/Bei neuen Buchungen benachrichtigen/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    const [, payload] = post.mock.calls[0];
    expect((payload as { notifyOnBooking: boolean }).notifyOnBooking).toBe(true);
  });

  it('Checkbox lässt sich abschalten -> notifyOnBooking:false im Payload', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    const checkbox = screen.getByLabelText(/Bei neuen Buchungen benachrichtigen/i) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    const [, payload] = post.mock.calls[0];
    expect((payload as { notifyOnBooking: boolean }).notifyOnBooking).toBe(false);
  });

  it('Default ist Stunden-Aufteilung -> slotDurationMinutes:60 im Payload', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [, payload] = post.mock.calls[0];
    expect((payload as { slotDurationMinutes: number }).slotDurationMinutes).toBe(60);
  });

  it('Wahl "Tage": slotDurationMinutes:1440, Presets wechseln auf Wochen/40-Tage, Hinweistext erscheint', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    fireEvent.click(screen.getByRole('button', { name: /Tage/i }));
    // Alte Stunden-Presets sind weg, neue Tages-Presets erscheinen.
    expect(screen.queryByRole('button', { name: '24 Stunden' })).toBeNull();
    expect(screen.getByRole('button', { name: '2 Wochen' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '4 Wochen' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '40 Tage' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T14:00' } });
    expect(screen.getByText(/Jeder Tag läuft von 14:00 bis 14:00 des Folgetags/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const [, payload] = post.mock.calls[0];
    expect((payload as { slotDurationMinutes: number }).slotDurationMinutes).toBe(1440);
  });
});
