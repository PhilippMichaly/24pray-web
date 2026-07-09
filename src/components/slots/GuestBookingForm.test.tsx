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
      <GuestBookingForm slot={slot} projectTitle="fix2-Wache" projectTz="Europe/Berlin" onSubmit={onSubmit} />,
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
      <GuestBookingForm slot={slot} projectTitle="fix2-Wache" projectTz="Europe/Berlin" onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'fix2 Gast' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'nicht-valide' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(screen.queryByText(/gültige e-mail/i)).not.toBeNull());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
