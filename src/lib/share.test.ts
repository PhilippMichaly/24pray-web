// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/toast-store', () => ({ toast: vi.fn() }));

import { buildWatchUrl, waShareHref, tgShareHref, shareViaSystem } from './share';
import { toast } from '@/components/ui/toast-store';

describe('share lib (Backlog 4)', () => {
  it('buildWatchUrl baut Projekt-URL, mit encodetem invite', () => {
    expect(buildWatchUrl('p1')).toBe(`${window.location.origin}/projects/p1`);
    expect(buildWatchUrl('p1', 'a+b')).toBe(`${window.location.origin}/projects/p1?invite=a%2Bb`);
  });

  it('waShareHref/tgShareHref encodieren Text und URL vollständig', () => {
    const wa = waShareHref('Hallo & Amen #1', 'https://x/p/1');
    expect(wa.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(wa.split('text=')[1])).toBe('Hallo & Amen #1\n\nhttps://x/p/1');
    const tg = tgShareHref('Hallo & Amen #1', 'https://x/p/1');
    expect(tg).toContain('https://t.me/share/url?');
    expect(tg).toContain(`url=${encodeURIComponent('https://x/p/1')}`);
    expect(tg).toContain(`text=${encodeURIComponent('Hallo & Amen #1')}`);
  });

  it('shareViaSystem nutzt navigator.share wenn vorhanden', async () => {
    const share = vi.fn(async (_d: { text?: string; url?: string }) => {});
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await shareViaSystem('Text', 'https://x/p/1');
    expect(share).toHaveBeenCalledWith({ text: 'Text', url: 'https://x/p/1' });
  });

  it('shareViaSystem faellt ohne navigator.share auf Clipboard + Toast zurueck', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const write = vi.fn(async (_s: string) => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true });
    await shareViaSystem('Text', 'https://x/p/1');
    expect(write).toHaveBeenCalledWith('Text\n\nhttps://x/p/1');
    expect(toast).toHaveBeenCalled();
  });
});
