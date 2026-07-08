// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  getRequests: vi.fn(async () => [
    { id: 'r1', authorName: 'Ruth Klein', text: 'Update: Lena geht es besser!', createdAt: '2026-07-08T10:00:00.000Z' },
  ]),
  postRequest: vi.fn(async () => ({})),
}));

import { RequestsFeed } from './RequestsFeed';

describe('RequestsFeed — Updates nur vom Ketten-Owner (eine Kette = ein Anliegen)', () => {
  beforeEach(() => cleanup());

  it('Owner sieht das Post-Formular', async () => {
    render(<RequestsFeed projectId="p1" projectTz="UTC" isLoggedIn isOrganizer />);
    await waitFor(() => expect(screen.getByText(/Lena geht es besser/)).toBeTruthy());
    expect(screen.getByRole('button', { name: /teilen|posten/i })).toBeTruthy();
  });

  it('Nicht-Owner (auch eingeloggt) sieht KEIN Formular, nur die Updates', async () => {
    render(<RequestsFeed projectId="p1" projectTz="UTC" isLoggedIn isOrganizer={false} />);
    await waitFor(() => expect(screen.getByText(/Lena geht es besser/)).toBeTruthy());
    expect(screen.queryByRole('button', { name: /teilen|posten/i })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
