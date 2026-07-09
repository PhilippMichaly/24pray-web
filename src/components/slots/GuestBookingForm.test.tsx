// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { GuestBookingForm } from './GuestBookingForm';
import type { SlotViewModel } from './types';

const slot: SlotViewModel = {
  key: '2026-08-01T03:00:00.000Z',
  slotId: null,
  startTime: '2026-08-01T03:00:00.000Z',
  endTime: '2026-08-01T04:00:00.000Z',
  isMine: false,
  userName: null,
  status: 'FREE',
  isNight: true,
  isLargestGap: false,
  state: 'FREE',
};

// fix2 (HOCH, End-User-Test v2 Befund 3): GuestSchema erzwang bislang eine E-Mail
// (`z.string().email(...)` ohne `.optional()`), obwohl das Backend guestEmail optional
// verarbeitet (BookSlotBody erlaubt fehlende E-Mail) — Gäste ohne E-Mail konnten das
// Formular nie absenden.
describe('GuestBookingForm — E-Mail ist optional (fix2)', () => {
  afterEach(() => cleanup());

  // fireEvent.submit(form) statt Klick auf den Submit-Button: ein Klick löst bei
  // <input type="email"> die native HTML5-Constraint-Validation aus, die ein ungültiges
  // Feld VOR unserem eigenen onSubmit-Handler abfängt (kein 'submit'-Event, unser Handler
  // läuft nie) — das würde beide Fälle hier unbrauchbar testen. Ein direkt dispatchtes
  // 'submit'-Event umgeht die implizite Browser-Validierung und trifft exakt unsere Zod-Logik.
  it('Buchung ohne E-Mail: onSubmit wird mit guestEmail: undefined aufgerufen, kein Validierungsfehler', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ guestToken: 'tok' });
    const { container } = render(
      <GuestBookingForm
        slot={slot}
        projectTitle="fix2-Wache"
        projectTz="Europe/Berlin"
        projectId="p-fix2"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'fix2 Gast' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ guestName: 'fix2 Gast', guestEmail: undefined });
    expect(screen.queryByText(/gültige e-mail/i)).toBeNull();
  });

  it('ungültige, nicht-leere E-Mail bleibt ein Validierungsfehler', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ guestToken: 'tok' });
    const { container } = render(
      <GuestBookingForm
        slot={slot}
        projectTitle="fix2-Wache"
        projectTz="Europe/Berlin"
        projectId="p-fix2"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'fix2 Gast' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'nicht-valide' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(screen.queryByText(/gültige e-mail/i)).not.toBeNull());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// Backlog 4, Task 2: Einladungs-Moment nach Buchung — Einladungs-Absatz + Share-Trio
// (WhatsApp/Telegram/Signal) im Gast-Erfolgs-Screen, mit der Wachen-URL (Task 1: src/lib/share.ts).
describe('GuestBookingForm — Einladungs-Moment nach Buchung (Backlog 4)', () => {
  afterEach(() => cleanup());

  it('Erfolgs-Screen zeigt Einladung + Share-Zeile (WhatsApp/Telegram/Signal) mit Wachen-URL', async () => {
    render(
      <GuestBookingForm
        slot={slot}
        projectTitle="Wache Lena"
        projectTz="UTC"
        projectId="p1"
        invite="tok1"
        onSubmit={async () => ({ guestToken: 'g1' })}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Maria' } });
    fireEvent.click(screen.getByRole('button', { name: /Stunde|übernehmen/i }));
    await waitFor(() => expect(screen.getByText(/gehört dir/i)).toBeTruthy());
    // Einladungs-Absatz + Trio
    expect(screen.getByText(/Lade jemanden ein/i)).toBeTruthy();
    const wa = screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement;
    expect(wa.href).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(wa.href)).toContain('/projects/p1?invite=tok1');
    expect(screen.getByRole('link', { name: /telegram/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /signal/i })).toBeTruthy();
  });
});
