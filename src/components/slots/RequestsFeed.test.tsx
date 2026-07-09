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

  it('jedes Update hat WhatsApp- und Telegram-Share-Links mit Text + Wachen-URL', async () => {
    render(<RequestsFeed projectId="p1" projectTz="UTC" isLoggedIn={false} isOrganizer={false} />);
    await waitFor(() => expect(screen.getByText(/Lena geht es besser/)).toBeTruthy());
    const wa = screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement;
    expect(wa.href).toContain('https://wa.me/?text=');
    const waText = decodeURIComponent(wa.href.split('text=')[1]);
    expect(waText).toContain('Update: Lena geht es besser!');
    expect(waText).toContain('/projects/p1');
    expect(wa.target).toBe('_blank');
    const tg = screen.getByRole('link', { name: /telegram/i }) as HTMLAnchorElement;
    expect(tg.href).toContain('https://t.me/share/url?');
    expect(decodeURIComponent(tg.href)).toContain('/projects/p1');
    expect(tg.target).toBe('_blank');
  });

  it('System-Share-Button (Signal & mehr) ruft navigator.share mit Text + URL auf', async () => {
    const share = vi.fn(async (_data: { text?: string; url?: string }) => {});
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    render(<RequestsFeed projectId="p1" projectTz="UTC" isLoggedIn={false} isOrganizer={false} />);
    await waitFor(() => expect(screen.getByText(/Lena geht es besser/)).toBeTruthy());
    screen.getByRole('button', { name: /signal/i }).click();
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    const arg = share.mock.calls[0][0] as { text?: string; url?: string };
    expect(arg.text).toContain('Update: Lena geht es besser!');
    expect(arg.url).toContain('/projects/p1');
  });
});
