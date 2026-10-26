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

describe('Eigener Endzeitpunkt — Custom-Modus (Phase 01)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  async function goToStep2() {
    render(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText(/^Titel/i), { target: { value: 'wb-Nachtgebet' } });
    fireEvent.click(screen.getByRole('button', { name: /Weiter/i }));
    await waitFor(() => expect(screen.getByLabelText(/Start/i)).toBeTruthy());
  }

  it('Custom-Button zeigt das Endfeld mit dem 48-h-Preset-Ende vorbelegt (D-08)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Eigener Endzeitpunkt/i }));

    const endInput = screen.getByLabelText(/^Ende/i) as HTMLInputElement;
    expect(endInput.value).toBe('2099-01-03T00:00');
  });

  it('Custom-Ende landet exakt als endDate im Payload (D-09)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Eigener Endzeitpunkt/i }));
    fireEvent.change(screen.getByLabelText(/^Ende/i), { target: { value: '2099-01-03T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0];
    expect((payload as { endDate: string }).endDate).toBe(new Date('2099-01-03T00:00').toISOString());
    expect((payload as { slotDurationMinutes: number }).slotDurationMinutes).toBe(60);
    expect(push).toHaveBeenCalledWith('/projects/p1');
  });

  it('Preset-Klick verlässt den Custom-Modus; gespeichertes Custom-Ende wird nicht gesendet (D-05)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await goToStep2();

    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Eigener Endzeitpunkt/i }));
    fireEvent.change(screen.getByLabelText(/^Ende/i), { target: { value: '2099-01-05T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: '24 Stunden' }));
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0];
    expect((payload as { endDate: string }).endDate).toBe(new Date('2099-01-02T00:00').toISOString());
  });
});

describe('Eigener Endzeitpunkt — Validierungs-UX (Phase 01)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  async function goToStep2() {
    render(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText(/^Titel/i), { target: { value: 'wb-Nachtgebet' } });
    fireEvent.click(screen.getByRole('button', { name: /Weiter/i }));
    await waitFor(() => expect(screen.getByLabelText(/Start/i)).toBeTruthy());
  }

  async function startCustomMode(start = '2099-01-01T00:00') {
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: start } });
    fireEvent.click(screen.getByRole('button', { name: /Eigener Endzeitpunkt/i }));
    return screen.getByLabelText(/^Ende/i) as HTMLInputElement;
  }

  it('Tippen ohne Blur zeigt keinen Fehler; Blur zeigt lokalisierten Fehler und aria-invalid (D-10)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:30' } }); // 48,5 h — nicht ausgerichtet
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.blur(endInput);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(endInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('Submit mit ungültigem Ende ruft post nicht auf (D-14)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:30' } });
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(post).not.toHaveBeenCalled();
  });

  it('Ende vor dem Start wird mit errEndAfterStart-Fehlertext abgelehnt', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2098-12-31T23:00' } });
    fireEvent.blur(endInput);

    expect(screen.getByRole('alert').textContent).toBe('Das Ende muss nach dem Start liegen.');
  });

  it('Nicht ausgerichtetes Ende: Fehler nennt konkretes Beispiel (D-13), Eingabe bleibt unverändert', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:30' } });
    fireEvent.blur(endInput);

    const alert = screen.getByRole('alert');
    // Nächstmögliches Ende: Start + 49 h = 3.1.2099, 01:00 Uhr (Browser-Lokalzeit)
    expect(alert.textContent).toContain('2099');
    expect(alert.textContent).toMatch(/3\./);
    expect(alert.textContent).toMatch(/01:00/);
    expect(endInput.value).toBe('2099-01-03T00:30');
  });

  it('Startänderung lässt den Feldwert unverändert und setzt den Fehler neu (D-04)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:30' } });
    fireEvent.blur(endInput);
    expect(screen.getByRole('alert')).toBeTruthy();

    // Start um 30 Minuten verschieben → Spanne exakt 48 h = ausgerichtet
    fireEvent.change(screen.getByLabelText(/Start/i), { target: { value: '2099-01-01T00:30' } });
    expect(endInput.value).toBe('2099-01-03T00:30'); // Feldwert bleibt stehen
    expect(screen.queryByRole('alert')).toBeNull(); // Fehler zurückgesetzt
  });

  it('Wechsel Stunden→Tage im Custom-Modus: Feldwert bleibt, 1440-Ausrichtung wird geprüft (D-03)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T12:00' } }); // 60 h
    fireEvent.blur(endInput);
    expect(screen.queryByRole('alert')).toBeNull(); // für 60-Minuten-Slots ausgerichtet

    fireEvent.click(screen.getByRole('button', { name: /Tage/i }));
    expect(endInput.value).toBe('2099-01-03T12:00'); // absoluter Endpunkt bleibt erhalten
    expect(screen.getByRole('alert')).toBeTruthy(); // 60 h kein Vielfaches von 1440 min
  });

  it('Custom-Modus zeigt keine veraltete Preset-Stundenzahl in der Summenzeile', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:00' } });
    expect(screen.queryByText(/Stunden ab/)).toBeNull();
    expect(screen.queryByText(/Tage ab/)).toBeNull();
  });

  it('API-Fehler erscheinen nur in der allgemeinen Fehlerzeile, das Endfeld bleibt unberührt (Pitfall 6)', async () => {
    // Vorherige Tests ohne Submit hinterlassen queueOnce-Werte — für den Reject sauber zurücksetzen.
    post.mockReset();
    post.mockRejectedValueOnce(new Error('Serverfehler 500'));
    const endInput = await startCustomMode();

    fireEvent.change(endInput, { target: { value: '2099-01-03T00:00' } }); // valides Ende
    fireEvent.click(screen.getByRole('button', { name: /Gebetswache erstellen/i }));

    await waitFor(() => expect(screen.getByText('Serverfehler 500')).toBeTruthy());
    expect(endInput.getAttribute('aria-invalid')).toBeNull();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
