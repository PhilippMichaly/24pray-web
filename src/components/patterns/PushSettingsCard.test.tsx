// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const getPushState = vi.fn(async (..._a: unknown[]) => 'unsubscribed');
const enablePush = vi.fn(async (..._a: unknown[]) => undefined);
const disablePush = vi.fn(async (..._a: unknown[]) => undefined);
vi.mock('@/lib/push', () => ({
  getPushState: (...a: unknown[]) => getPushState(...a),
  enablePush: (...a: unknown[]) => enablePush(...a),
  disablePush: (...a: unknown[]) => disablePush(...a),
}));

import { PushSettingsCard } from './PushSettingsCard';

describe('PushSettingsCard (Backlog 7)', () => {
  beforeEach(() => { cleanup(); getPushState.mockClear(); enablePush.mockClear(); });

  it('unsubscribed → Aktivieren-Button, Klick ruft enablePush', async () => {
    render(<PushSettingsCard />);
    const btn = await screen.findByRole('button', { name: /aktivieren|enable/i });
    fireEvent.click(btn);
    await waitFor(() => expect(enablePush).toHaveBeenCalledOnce());
  });

  it('unsupported → kein Button, erklärender Text', async () => {
    getPushState.mockResolvedValueOnce('unsupported');
    render(<PushSettingsCard />);
    await waitFor(() => expect(screen.getByText(/unterstützt keine push/i)).toBeTruthy());
    expect(screen.queryByRole('button')).toBeNull();
  });
});
