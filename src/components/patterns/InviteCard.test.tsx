// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const rotateInvite = vi.fn();
vi.mock('@/lib/api', () => ({ rotateInvite: (...a: unknown[]) => rotateInvite(...a) }));

const toast = vi.fn();
vi.mock('@/components/ui/toast-store', () => ({ toast: (...a: unknown[]) => toast(...a) }));

import { InviteCard } from './InviteCard';

// Wie watch-client: der Token lebt im Eltern-State, die Karte meldet nur den neuen Wert.
function Harness() {
  const [token, setToken] = useState('old');
  return <InviteCard projectId="p1" inviteUrl={`https://24pray.org/join/${token}`} onRotated={setToken} />;
}

const rotateBtn = () => screen.getByRole('button', { name: /Link erneuern|Renew link/i });

describe('InviteCard — Link erneuern', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('Klick fragt erst nach, Bestätigen ruft rotateInvite und zeigt die neue URL', async () => {
    rotateInvite.mockResolvedValueOnce({ inviteToken: 'new' });
    render(<Harness />);

    fireEvent.click(rotateBtn());
    expect(rotateInvite).not.toHaveBeenCalled();
    expect(screen.getByText(/alte Link funktioniert danach nicht mehr|old link will stop working/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Jetzt erneuern|Renew now/i }));

    await waitFor(() => expect(rotateInvite).toHaveBeenCalledWith('p1'));
    await waitFor(() =>
      expect((screen.getByDisplayValue(/join\//) as HTMLInputElement).value).toBe('https://24pray.org/join/new'),
    );
  });

  it('Abbrechen erneuert nichts', () => {
    render(<Harness />);
    fireEvent.click(rotateBtn());
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen|Cancel/i }));
    expect(rotateInvite).not.toHaveBeenCalled();
    expect((screen.getByDisplayValue(/join\//) as HTMLInputElement).value).toBe('https://24pray.org/join/old');
  });

  it('Fehler: Toast, alte URL bleibt', async () => {
    rotateInvite.mockRejectedValueOnce(new Error('Forbidden'));
    render(<Harness />);
    fireEvent.click(rotateBtn());
    fireEvent.click(screen.getByRole('button', { name: /Jetzt erneuern|Renew now/i }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' })));
    expect((screen.getByDisplayValue(/join\//) as HTMLInputElement).value).toBe('https://24pray.org/join/old');
  });
});
